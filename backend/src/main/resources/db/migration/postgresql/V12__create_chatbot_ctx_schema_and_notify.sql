-- Realtime chatbot context schema + LISTEN/NOTIFY contract emitters
-- Scope: Postgres side only. Chatbot worker listens and rebuilds chatbot_ctx read-model.

CREATE SCHEMA IF NOT EXISTS chatbot_ctx;

-- 1) Idempotency ledger for event processing
CREATE TABLE IF NOT EXISTS chatbot_ctx.event_dedup (
    event_id UUID PRIMARY KEY,
    channel_name TEXT NOT NULL,
    aggregate_id TEXT,
    user_id UUID,
    event_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'RECEIVED',
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_chatbot_ctx_event_dedup_user_id
    ON chatbot_ctx.event_dedup(user_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_ctx_event_dedup_event_ts
    ON chatbot_ctx.event_dedup(event_ts DESC);

-- 2) User profile snapshot for prompt personalization
CREATE TABLE IF NOT EXISTS chatbot_ctx.user_profile_snapshot (
    user_id UUID PRIMARY KEY,
    full_name TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    underlying_conditions TEXT,
    drug_allergies TEXT,
    current_medications TEXT,
    pregnancy_or_breastfeeding BOOLEAN,
    source_updated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Aggregated purchase behavior by user
CREATE TABLE IF NOT EXISTS chatbot_ctx.purchase_history_summary (
    user_id UUID PRIMARY KEY,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(15,2) NOT NULL DEFAULT 0,
    avg_order_value NUMERIC(15,2) NOT NULL DEFAULT 0,
    last_order_id UUID,
    last_order_at TIMESTAMPTZ,
    last_order_status VARCHAR(30),
    top_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    top_brands JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_price_band JSONB,
    source_updated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Product preference profile used for reranking recommendations
CREATE TABLE IF NOT EXISTS chatbot_ctx.user_product_preference (
    user_id UUID PRIMARY KEY,
    preferred_dosage_forms JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_brands JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_units JSONB NOT NULL DEFAULT '[]'::jsonb,
    price_sensitivity_score NUMERIC(5,2),
    preferred_price_min NUMERIC(15,2),
    preferred_price_max NUMERIC(15,2),
    confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    source_updated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Cross-session memory facts (AI + pharmacist conversation facts)
CREATE TABLE IF NOT EXISTS chatbot_ctx.conversation_memory (
    user_id UUID PRIMARY KEY,
    facts_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    safety_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    latest_chat_room_id UUID,
    last_ai_message_at TIMESTAMPTZ,
    last_pharmacist_message_at TIMESTAMPTZ,
    summary_text TEXT,
    source_updated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Session-local memory (optional for short-term grounding)
CREATE TABLE IF NOT EXISTS chatbot_ctx.session_memory (
    session_id UUID PRIMARY KEY,
    user_id UUID,
    rolling_summary TEXT,
    key_slots JSONB NOT NULL DEFAULT '{}'::jsonb,
    recent_turns JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_updated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_ctx_session_memory_user_id
    ON chatbot_ctx.session_memory(user_id);

-- 7) Shared helper to emit events
CREATE OR REPLACE FUNCTION chatbot_ctx.notify_event(
    p_channel TEXT,
    p_event_type TEXT,
    p_user_id UUID,
    p_entity_id TEXT,
    p_session_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_id UUID := gen_random_uuid();
    v_payload JSONB;
BEGIN
    v_payload := jsonb_build_object(
        'event_id', v_event_id,
        'event_type', p_event_type,
        'entity_id', p_entity_id,
        'user_id', p_user_id,
        'session_id', p_session_id,
        'occurred_at', now()
    );

    PERFORM pg_notify(p_channel, v_payload::text);
END;
$$;

-- 8) Trigger: users -> ctx_user_profile_changed
CREATE OR REPLACE FUNCTION chatbot_ctx.trg_users_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM chatbot_ctx.notify_event(
        'ctx_user_profile_changed',
        TG_OP,
        NEW.id,
        NEW.id::text,
        NULL
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_notify_ctx ON users;
CREATE TRIGGER trg_users_notify_ctx
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION chatbot_ctx.trg_users_notify();

-- 9) Trigger: orders -> ctx_order_changed
CREATE OR REPLACE FUNCTION chatbot_ctx.trg_orders_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM chatbot_ctx.notify_event(
        'ctx_order_changed',
        TG_OP,
        NEW.user_id,
        NEW.id::text,
        NULL
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_notify_ctx ON orders;
CREATE TRIGGER trg_orders_notify_ctx
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION chatbot_ctx.trg_orders_notify();

-- 10) Trigger: order_items -> ctx_order_changed (resolve user_id from order)
CREATE OR REPLACE FUNCTION chatbot_ctx.trg_order_items_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
BEGIN
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    SELECT o.user_id INTO v_user_id
    FROM orders o
    WHERE o.id = v_order_id;

    IF v_user_id IS NOT NULL THEN
        PERFORM chatbot_ctx.notify_event(
            'ctx_order_changed',
            TG_OP,
            v_user_id,
            v_order_id::text,
            NULL
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_notify_ctx ON order_items;
CREATE TRIGGER trg_order_items_notify_ctx
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION chatbot_ctx.trg_order_items_notify();

-- 11) Trigger: chat_conversations -> ctx_chat_message_created
-- Note: detailed chat transcript lives in MongoDB. This Postgres event is a lightweight signal.
CREATE OR REPLACE FUNCTION chatbot_ctx.trg_chat_conversations_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Emit only when last_message or updated_at changed, or on insert.
    IF TG_OP = 'INSERT'
       OR NEW.last_message IS DISTINCT FROM OLD.last_message
       OR NEW.updated_at IS DISTINCT FROM OLD.updated_at THEN

        PERFORM chatbot_ctx.notify_event(
            'ctx_chat_message_created',
            TG_OP,
            NEW.user_id,
            NEW.id::text,
            NEW.id::text
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_conversations_notify_ctx ON chat_conversations;
CREATE TRIGGER trg_chat_conversations_notify_ctx
AFTER INSERT OR UPDATE ON chat_conversations
FOR EACH ROW
EXECUTE FUNCTION chatbot_ctx.trg_chat_conversations_notify();

-- 12) Optional: helper view for chatbot read access
CREATE OR REPLACE VIEW chatbot_ctx.v_user_context_bundle AS
SELECT
    u.user_id,
    u.full_name,
    u.date_of_birth,
    u.gender,
    u.underlying_conditions,
    u.drug_allergies,
    u.current_medications,
    p.total_orders,
    p.total_spent,
    p.avg_order_value,
    p.last_order_at,
    p.top_categories,
    p.top_brands,
    pref.preferred_dosage_forms,
    pref.preferred_brands,
    pref.preferred_price_min,
    pref.preferred_price_max,
    mem.facts_json,
    mem.safety_flags,
    mem.summary_text,
    mem.updated_at AS memory_updated_at
FROM chatbot_ctx.user_profile_snapshot u
LEFT JOIN chatbot_ctx.purchase_history_summary p ON p.user_id = u.user_id
LEFT JOIN chatbot_ctx.user_product_preference pref ON pref.user_id = u.user_id
LEFT JOIN chatbot_ctx.conversation_memory mem ON mem.user_id = u.user_id;

-- 13) Suggested grants (adjust role names to your deployment)
-- GRANT USAGE ON SCHEMA chatbot_ctx TO chatbot_reader;
-- GRANT SELECT ON ALL TABLES IN SCHEMA chatbot_ctx TO chatbot_reader;
-- GRANT SELECT ON chatbot_ctx.v_user_context_bundle TO chatbot_reader;
-- GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA chatbot_ctx TO chatbot_updater;

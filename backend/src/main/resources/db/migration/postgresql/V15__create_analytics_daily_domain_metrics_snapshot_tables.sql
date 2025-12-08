CREATE TABLE analytics_daily_user_metrics_snapshot (
    snapshot_date DATE PRIMARY KEY,
    users_new BIGINT NOT NULL DEFAULT 0,
    users_total BIGINT NOT NULL DEFAULT 0,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_daily_user_metrics_snapshot_is_final
    ON analytics_daily_user_metrics_snapshot(is_final);

CREATE TABLE analytics_daily_product_metrics_snapshot (
    snapshot_date DATE PRIMARY KEY,
    products_new BIGINT NOT NULL DEFAULT 0,
    products_total BIGINT NOT NULL DEFAULT 0,
    products_active_total BIGINT NOT NULL DEFAULT 0,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_daily_product_metrics_snapshot_is_final
    ON analytics_daily_product_metrics_snapshot(is_final);

CREATE TABLE analytics_daily_order_metrics_snapshot (
    snapshot_date DATE PRIMARY KEY,
    delivered_orders_new BIGINT NOT NULL DEFAULT 0,
    delivered_orders_total BIGINT NOT NULL DEFAULT 0,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_daily_order_metrics_snapshot_is_final
    ON analytics_daily_order_metrics_snapshot(is_final);

CREATE TABLE analytics_daily_revenue_metrics_snapshot (
    snapshot_date DATE PRIMARY KEY,
    delivered_revenue_new NUMERIC(18,2) NOT NULL DEFAULT 0,
    delivered_revenue_total NUMERIC(18,2) NOT NULL DEFAULT 0,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_daily_revenue_metrics_snapshot_is_final
    ON analytics_daily_revenue_metrics_snapshot(is_final);

CREATE TABLE analytics_daily_consultation_metrics_snapshot (
    snapshot_date DATE PRIMARY KEY,
    consultations_new BIGINT NOT NULL DEFAULT 0,
    consultations_total BIGINT NOT NULL DEFAULT 0,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_daily_consultation_metrics_snapshot_is_final
    ON analytics_daily_consultation_metrics_snapshot(is_final);

CREATE TABLE checkout_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkout_mode VARCHAR(30) NOT NULL,
    address_id UUID NOT NULL REFERENCES addresses(id),
    note TEXT,
    items_snapshot_json TEXT NOT NULL,
    shipping_full_name VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_fee NUMERIC(15,2) NOT NULL,
    ghn_district_id INTEGER NOT NULL,
    ghn_ward_code VARCHAR(50) NOT NULL,
    province_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    shipping_service_id INTEGER NOT NULL,
    item_total_amount NUMERIC(15,2) NOT NULL,
    final_amount NUMERIC(15,2) NOT NULL,
    expected_delivery_time BIGINT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkout_previews_user_id ON checkout_previews(user_id);
CREATE INDEX idx_checkout_previews_expires_at ON checkout_previews(expires_at);
CREATE INDEX idx_checkout_previews_user_expires_at ON checkout_previews(user_id, expires_at DESC);

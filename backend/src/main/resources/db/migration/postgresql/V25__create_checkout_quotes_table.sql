CREATE TABLE checkout_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_id UUID NOT NULL REFERENCES addresses(id),
    shipping_fee NUMERIC(15,2) NOT NULL,
    shipping_service_id INTEGER NOT NULL,
    expected_delivery_time BIGINT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkout_quotes_user_id ON checkout_quotes(user_id);
CREATE INDEX idx_checkout_quotes_expires_at ON checkout_quotes(expires_at);
CREATE INDEX idx_checkout_quotes_user_expires_at ON checkout_quotes(user_id, expires_at DESC);

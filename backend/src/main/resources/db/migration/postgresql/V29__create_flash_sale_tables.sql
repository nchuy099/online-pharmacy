CREATE TABLE flash_sale_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_flash_sale_campaigns_status ON flash_sale_campaigns(status);
CREATE INDEX idx_flash_sale_campaigns_start_at ON flash_sale_campaigns(start_at DESC);

CREATE TABLE flash_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES flash_sale_campaigns(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    flash_price NUMERIC(15,2) NOT NULL,
    original_price NUMERIC(15,2) NOT NULL,
    sale_stock INTEGER NOT NULL,
    per_user_limit INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_flash_sale_items_flash_price CHECK (flash_price >= 0),
    CONSTRAINT chk_flash_sale_items_original_price CHECK (original_price >= 0),
    CONSTRAINT chk_flash_sale_items_sale_stock CHECK (sale_stock > 0),
    CONSTRAINT chk_flash_sale_items_per_user_limit CHECK (per_user_limit > 0)
);

CREATE UNIQUE INDEX uq_flash_sale_items_campaign_variant
    ON flash_sale_items(campaign_id, variant_id);
CREATE INDEX idx_flash_sale_items_campaign_id ON flash_sale_items(campaign_id);
CREATE INDEX idx_flash_sale_items_variant_id ON flash_sale_items(variant_id);
CREATE INDEX idx_flash_sale_items_status ON flash_sale_items(status);

CREATE TABLE flash_sale_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_token UUID NOT NULL UNIQUE,
    item_id UUID NOT NULL REFERENCES flash_sale_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'HELD',
    expires_at TIMESTAMPTZ NOT NULL,
    order_id UUID UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_flash_sale_reservations_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_flash_sale_reservations_item_id ON flash_sale_reservations(item_id);
CREATE INDEX idx_flash_sale_reservations_user_id ON flash_sale_reservations(user_id);
CREATE INDEX idx_flash_sale_reservations_status ON flash_sale_reservations(status);
CREATE INDEX idx_flash_sale_reservations_expires_at ON flash_sale_reservations(expires_at);
CREATE UNIQUE INDEX uq_flash_sale_reservations_idempotency
    ON flash_sale_reservations(item_id, user_id, idempotency_key);

ALTER TABLE orders
    ADD COLUMN flash_sale_reservation_id UUID;

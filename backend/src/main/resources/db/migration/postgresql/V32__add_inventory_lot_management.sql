CREATE TABLE inventory_lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    lot_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    unit_cost NUMERIC(15,2),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_inventory_lots_non_negative CHECK (quantity_on_hand >= 0 AND quantity_reserved >= 0),
    CONSTRAINT ck_inventory_lots_reserved_le_on_hand CHECK (quantity_reserved <= quantity_on_hand),
    CONSTRAINT uk_inventory_lots_variant_lot_expiry UNIQUE (variant_id, lot_number, expiry_date)
);

CREATE INDEX idx_inventory_lots_variant_fefo
    ON inventory_lots (variant_id, expiry_date, received_at, id)
    WHERE status = 'ACTIVE';

CREATE INDEX idx_inventory_lots_expiry ON inventory_lots (expiry_date);
CREATE INDEX idx_inventory_lots_variant ON inventory_lots (variant_id);

ALTER TABLE inventory_transactions
    ADD COLUMN lot_id UUID REFERENCES inventory_lots(id),
    ADD COLUMN variant_id UUID REFERENCES product_variants(id);

CREATE INDEX idx_inventory_transactions_variant_created_at
    ON inventory_transactions(variant_id, created_at DESC);

CREATE INDEX idx_inventory_transactions_lot_created_at
    ON inventory_transactions(lot_id, created_at DESC)
    WHERE lot_id IS NOT NULL;

CREATE TABLE order_item_inventory_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    lot_id UUID NOT NULL REFERENCES inventory_lots(id),
    reserved_quantity INTEGER NOT NULL,
    exported_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_order_item_inventory_allocations_reserved_positive CHECK (reserved_quantity > 0),
    CONSTRAINT ck_order_item_inventory_allocations_exported_valid CHECK (
        exported_quantity >= 0 AND exported_quantity <= reserved_quantity
    )
);

CREATE INDEX idx_order_item_inventory_allocations_order_item
    ON order_item_inventory_allocations(order_item_id);

CREATE INDEX idx_order_item_inventory_allocations_lot
    ON order_item_inventory_allocations(lot_id);

INSERT INTO inventory_lots (
    variant_id,
    lot_number,
    expiry_date,
    received_at,
    quantity_on_hand,
    quantity_reserved,
    unit_cost,
    status
)
SELECT
    i.variant_id,
    'LEGACY-' || i.variant_id,
    DATE '2099-12-31',
    now(),
    i.quantity_on_hand,
    i.quantity_reserved,
    NULL,
    'ACTIVE'
FROM inventories i
WHERE i.quantity_on_hand > 0 OR i.quantity_reserved > 0;

UPDATE inventory_transactions t
SET variant_id = i.variant_id
FROM inventories i
WHERE t.inventory_id = i.id
  AND t.variant_id IS NULL;

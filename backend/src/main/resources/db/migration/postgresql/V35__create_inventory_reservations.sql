CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_key VARCHAR(255) NOT NULL UNIQUE,
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    reservation_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    expires_at TIMESTAMPTZ,
    committed_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_reservations_status_expires_at
    ON inventory_reservations(status, expires_at)
    WHERE status = 'RESERVED' AND expires_at IS NOT NULL;

CREATE TABLE inventory_reservation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES inventory_reservations(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    lot_id UUID NOT NULL REFERENCES inventory_lots(id),
    reserved_quantity INTEGER NOT NULL,
    exported_quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_inventory_reservation_items_reserved_positive CHECK (reserved_quantity > 0),
    CONSTRAINT ck_inventory_reservation_items_exported_valid CHECK (
        exported_quantity >= 0 AND exported_quantity <= reserved_quantity
    )
);

CREATE INDEX idx_inventory_reservation_items_reservation
    ON inventory_reservation_items(reservation_id);

CREATE INDEX idx_inventory_reservation_items_order_item
    ON inventory_reservation_items(order_item_id);

CREATE INDEX idx_inventory_reservation_items_lot
    ON inventory_reservation_items(lot_id);

INSERT INTO inventory_reservations (
    reservation_key,
    order_id,
    reservation_type,
    status,
    committed_at,
    created_at,
    updated_at
)
SELECT
    'ORDER:' || o.id,
    o.id,
    CASE WHEN o.flash_sale_reservation_id IS NOT NULL THEN 'FLASH_SALE' ELSE 'ORDER' END,
    CASE
        WHEN COALESCE(o.stock_exported, false) = true THEN 'COMMITTED'
        WHEN o.status = 'CANCELLED' THEN 'RELEASED'
        ELSE 'RESERVED'
    END,
    CASE WHEN COALESCE(o.stock_exported, false) = true THEN now() ELSE NULL END,
    now(),
    now()
FROM orders o
WHERE EXISTS (
    SELECT 1
    FROM order_items oi
    JOIN order_item_inventory_allocations a ON a.order_item_id = oi.id
    WHERE oi.order_id = o.id
)
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO inventory_reservation_items (
    reservation_id,
    order_item_id,
    variant_id,
    lot_id,
    reserved_quantity,
    exported_quantity,
    unit_cost,
    created_at,
    updated_at
)
SELECT
    r.id,
    a.order_item_id,
    oi.variant_id,
    a.lot_id,
    a.reserved_quantity,
    a.exported_quantity,
    l.unit_cost,
    a.created_at,
    a.updated_at
FROM order_item_inventory_allocations a
JOIN order_items oi ON oi.id = a.order_item_id
JOIN inventory_reservations r ON r.order_id = oi.order_id
JOIN inventory_lots l ON l.id = a.lot_id;

DROP TABLE order_item_inventory_allocations;

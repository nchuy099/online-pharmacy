CREATE TABLE inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    safety_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_inventories_on_hand CHECK (quantity_on_hand >= 0),
    CONSTRAINT chk_inventories_reserved CHECK (quantity_reserved >= 0),
    CONSTRAINT chk_inventories_available CHECK (quantity_reserved <= quantity_on_hand)
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(15,2),
    note TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX idx_inventory_transactions_inventory_created_at
    ON inventory_transactions(inventory_id, created_at DESC);
CREATE INDEX idx_inventory_transactions_reference
    ON inventory_transactions(reference_type, reference_id)
    WHERE reference_type IS NOT NULL;

CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_name VARCHAR(255),
    note TEXT,
    imported_by UUID REFERENCES users(id),
    imported_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goods_receipts_imported_by ON goods_receipts(imported_by);
CREATE INDEX idx_goods_receipts_imported_at ON goods_receipts(imported_at DESC);

CREATE TABLE goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goods_receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(15,2) NOT NULL,
    line_total NUMERIC(15,2) NOT NULL,
    batch_no VARCHAR(100),
    expiry_date DATE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_goods_receipt_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_goods_receipt_items_unit_cost CHECK (unit_cost >= 0),
    CONSTRAINT chk_goods_receipt_items_line_total CHECK (line_total >= 0)
);

CREATE INDEX idx_goods_receipt_items_receipt_id ON goods_receipt_items(goods_receipt_id);
CREATE INDEX idx_goods_receipt_items_variant_id ON goods_receipt_items(variant_id);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMPTZ;

CREATE TABLE order_return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    review_note TEXT,
    refund_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_order_return_refund_amount_non_negative CHECK (refund_amount >= 0)
);

CREATE INDEX idx_order_return_requests_order_created_at
    ON order_return_requests(order_id, created_at DESC);

CREATE UNIQUE INDEX uq_order_return_requests_active
    ON order_return_requests(order_id)
    WHERE status IN ('PENDING', 'APPROVED');

CREATE TABLE order_return_request_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_request_id UUID NOT NULL REFERENCES order_return_requests(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_return_request_images_request
    ON order_return_request_images(return_request_id);

INSERT INTO permissions (id, name, description, role_type, is_critical, is_assignable, created_at, updated_at)
VALUES (gen_random_uuid(), 'MANAGE_ORDER_RETURN', 'Manage order return requests', 'ADMIN', false, true, now(), now())
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    role_type = EXCLUDED.role_type,
    is_critical = EXCLUDED.is_critical,
    is_assignable = EXCLUDED.is_assignable,
    updated_at = now();

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'MANAGE_ORDER_RETURN'
WHERE r.name IN ('SUPER_ADMIN', 'STAFF')
ON CONFLICT DO NOTHING;

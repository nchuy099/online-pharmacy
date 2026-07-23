ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_user_id_idempotency_key
    ON orders(user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_external_transaction_id
    ON payments(external_transaction_id)
    WHERE external_transaction_id IS NOT NULL;

INSERT INTO permissions (id, name, description, role_type, is_critical, is_assignable, created_at, updated_at)
VALUES (gen_random_uuid(), 'PROCESS_ORDER', 'Move confirmed orders into processing', 'ADMIN', false, true, now(), now())
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    role_type = EXCLUDED.role_type,
    is_critical = EXCLUDED.is_critical,
    is_assignable = EXCLUDED.is_assignable,
    updated_at = now();

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'PROCESS_ORDER'
WHERE r.name IN ('SUPER_ADMIN', 'STAFF')
ON CONFLICT DO NOTHING;

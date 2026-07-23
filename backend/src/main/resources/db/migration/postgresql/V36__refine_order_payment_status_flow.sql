UPDATE orders
SET status = 'PENDING_CONFIRMATION',
    updated_at = NOW()
WHERE status = 'PENDING';

UPDATE payments
SET status = 'PENDING',
    updated_at = NOW()
WHERE status IN ('INITIATED', 'PROCESSING');

UPDATE payments
SET status = 'CANCELLED',
    updated_at = NOW()
WHERE status = 'FAILED';

INSERT INTO permissions (id, name, description, role_type, is_critical, is_assignable, created_at, updated_at)
VALUES (gen_random_uuid(), 'CONFIRM_PAYMENT_COLLECTION', 'Confirm COD payment collection', 'ADMIN', false, true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    role_type = EXCLUDED.role_type,
    is_critical = EXCLUDED.is_critical,
    is_assignable = EXCLUDED.is_assignable,
    updated_at = NOW();

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'CONFIRM_PAYMENT_COLLECTION'
WHERE r.name IN ('SUPER_ADMIN', 'STAFF')
ON CONFLICT DO NOTHING;

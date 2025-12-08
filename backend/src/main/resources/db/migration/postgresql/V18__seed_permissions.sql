INSERT INTO permissions (id, name, description, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'ANALYTICS_READ', 'Read analytics dashboard', now(), now()),
    (gen_random_uuid(), 'CATEGORY_CREATE', 'Create category', now(), now()),
    (gen_random_uuid(), 'CATEGORY_DELETE', 'Delete category', now(), now()),
    (gen_random_uuid(), 'CATEGORY_READ', 'Read category data', now(), now()),
    (gen_random_uuid(), 'CATEGORY_UPDATE', 'Update category', now(), now()),
    (gen_random_uuid(), 'INVENTORY_IMPORT', 'Import inventory stock', now(), now()),
    (gen_random_uuid(), 'INVENTORY_READ', 'Read inventory data', now(), now()),
    (gen_random_uuid(), 'ORDER_CONFIRM', 'Confirm orders', now(), now()),
    (gen_random_uuid(), 'ORDER_READ', 'Read orders', now(), now()),
    (gen_random_uuid(), 'ORDER_SHIP', 'Ship orders', now(), now()),
    (gen_random_uuid(), 'PAYMENT_READ', 'Read payment details', now(), now()),
    (gen_random_uuid(), 'PRODUCT_CREATE', 'Create product', now(), now()),
    (gen_random_uuid(), 'PRODUCT_DELETE', 'Delete product', now(), now()),
    (gen_random_uuid(), 'PRODUCT_IMAGE_UPLOAD', 'Create product image upload url', now(), now()),
    (gen_random_uuid(), 'PRODUCT_READ', 'Read product data', now(), now()),
    (gen_random_uuid(), 'PRODUCT_UPDATE', 'Update product', now(), now()),
    (gen_random_uuid(), 'RBAC_MANAGE', 'Manage RBAC configuration', now(), now()),
    (gen_random_uuid(), 'RBAC_READ', 'Read RBAC configuration', now(), now()),
    (gen_random_uuid(), 'USER_CREATE', 'Create users', now(), now()),
    (gen_random_uuid(), 'USER_PASSWORD_RESET', 'Reset user password', now(), now()),
    (gen_random_uuid(), 'USER_READ', 'Read users', now(), now()),
    (gen_random_uuid(), 'USER_ROLE_ASSIGN', 'Assign roles to users', now(), now()),
    (gen_random_uuid(), 'USER_STATUS_UPDATE', 'Update user status', now(), now()),
    (gen_random_uuid(), 'USER_UPDATE', 'Update users', now(), now())
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'ANALYTICS_READ',
    'CATEGORY_CREATE',
    'CATEGORY_DELETE',
    'CATEGORY_READ',
    'CATEGORY_UPDATE',
    'INVENTORY_IMPORT',
    'INVENTORY_READ',
    'ORDER_CONFIRM',
    'ORDER_READ',
    'ORDER_SHIP',
    'PAYMENT_READ',
    'PRODUCT_CREATE',
    'PRODUCT_DELETE',
    'PRODUCT_IMAGE_UPLOAD',
    'PRODUCT_READ',
    'PRODUCT_UPDATE',
    'RBAC_MANAGE',
    'RBAC_READ',
    'USER_CREATE',
    'USER_PASSWORD_RESET',
    'USER_READ',
    'USER_ROLE_ASSIGN',
    'USER_STATUS_UPDATE',
    'USER_UPDATE'
)
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'CATEGORY_CREATE',
    'CATEGORY_DELETE',
    'CATEGORY_READ',
    'CATEGORY_UPDATE',
    'INVENTORY_IMPORT',
    'INVENTORY_READ',
    'ORDER_CONFIRM',
    'ORDER_READ',
    'ORDER_SHIP',
    'PRODUCT_CREATE',
    'PRODUCT_DELETE',
    'PRODUCT_IMAGE_UPLOAD',
    'PRODUCT_READ',
    'PRODUCT_UPDATE'
)
WHERE r.name = 'STAFF'
ON CONFLICT DO NOTHING;

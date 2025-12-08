INSERT INTO permissions (id, name, description, role_type, is_critical, is_assignable, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'CUSTOMER_APP_ACCESS', 'Access customer application', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_PROFILE_READ', 'Read customer profile', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_PROFILE_UPDATE', 'Update customer profile', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_ADDRESS_READ', 'Read customer addresses', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_ADDRESS_MANAGE', 'Manage customer addresses', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_CART_MANAGE', 'Manage customer cart', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_CHECKOUT_MANAGE', 'Manage customer checkout', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_ORDER_READ', 'Read customer orders', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_ORDER_CANCEL', 'Cancel customer orders', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_REVIEW_MANAGE', 'Manage customer reviews', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_CHAT_MANAGE', 'Manage customer chat', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_HEALTH_PROFILE_READ', 'Read customer health profile', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_HEALTH_PROFILE_UPDATE', 'Update customer health profile', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'CUSTOMER_PRESCRIPTION_READ', 'Read customer prescriptions', 'CUSTOMER', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'PHARMACIST_APP_ACCESS', 'Access pharmacist application', 'PHARMACIST', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'PHARMACIST_PROFILE_READ', 'Read pharmacist profile', 'PHARMACIST', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'PHARMACIST_PROFILE_UPDATE', 'Update pharmacist profile', 'PHARMACIST', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'PHARMACIST_CHAT_MANAGE', 'Manage pharmacist chat', 'PHARMACIST', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'PHARMACIST_CONSULTATION_READ', 'Read consultation data', 'PHARMACIST', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'PHARMACIST_PATIENT_HISTORY_READ', 'Read patient history', 'PHARMACIST', FALSE, TRUE, now(), now()),
    (gen_random_uuid(), 'PHARMACIST_PRESCRIPTION_MANAGE', 'Manage prescriptions', 'PHARMACIST', FALSE, TRUE, now(), now())
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'CUSTOMER_APP_ACCESS',
    'CUSTOMER_PROFILE_READ',
    'CUSTOMER_PROFILE_UPDATE',
    'CUSTOMER_ADDRESS_READ',
    'CUSTOMER_ADDRESS_MANAGE',
    'CUSTOMER_CART_MANAGE',
    'CUSTOMER_CHECKOUT_MANAGE',
    'CUSTOMER_ORDER_READ',
    'CUSTOMER_ORDER_CANCEL',
    'CUSTOMER_REVIEW_MANAGE',
    'CUSTOMER_CHAT_MANAGE',
    'CUSTOMER_HEALTH_PROFILE_READ',
    'CUSTOMER_HEALTH_PROFILE_UPDATE',
    'CUSTOMER_PRESCRIPTION_READ'
)
WHERE r.name = 'CUSTOMER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'PHARMACIST_APP_ACCESS',
    'PHARMACIST_PROFILE_READ',
    'PHARMACIST_PROFILE_UPDATE',
    'PHARMACIST_CHAT_MANAGE',
    'PHARMACIST_CONSULTATION_READ',
    'PHARMACIST_PATIENT_HISTORY_READ',
    'PHARMACIST_PRESCRIPTION_MANAGE'
)
WHERE r.name = 'PHARMACIST'
ON CONFLICT DO NOTHING;

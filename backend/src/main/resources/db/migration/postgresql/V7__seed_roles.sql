INSERT INTO roles (id, name, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'SUPER_ADMIN', now(), now()),
    (gen_random_uuid(), 'STAFF', now(), now()),
    (gen_random_uuid(), 'PHARMACIST', now(), now()),
    (gen_random_uuid(), 'CUSTOMER', now(), now())
ON CONFLICT (name) DO NOTHING;

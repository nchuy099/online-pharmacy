ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS role_type VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
    ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE roles
SET role_type = CASE UPPER(name)
                    WHEN 'CUSTOMER' THEN 'CUSTOMER'
                    WHEN 'PHARMACIST' THEN 'PHARMACIST'
                    ELSE 'ADMIN'
                END,
    level = CASE UPPER(name)
                WHEN 'CUSTOMER' THEN 10
                WHEN 'PHARMACIST' THEN 20
                WHEN 'STAFF' THEN 50
                WHEN 'SUPER_ADMIN' THEN 100
                ELSE 0
            END,
    is_protected = CASE UPPER(name)
                       WHEN 'CUSTOMER' THEN TRUE
                       WHEN 'PHARMACIST' THEN TRUE
                       WHEN 'SUPER_ADMIN' THEN TRUE
                       ELSE FALSE
                   END;

ALTER TABLE permissions
    ADD COLUMN IF NOT EXISTS role_type VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
    ADD COLUMN IF NOT EXISTS is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_assignable BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE permissions
SET role_type = 'ADMIN',
    is_critical = CASE UPPER(name)
                      WHEN 'ANALYTICS_READ' THEN TRUE
                      WHEN 'PAYMENT_READ' THEN TRUE
                      WHEN 'RBAC_READ' THEN TRUE
                      WHEN 'RBAC_MANAGE' THEN TRUE
                      WHEN 'USER_CREATE' THEN TRUE
                      WHEN 'USER_UPDATE' THEN TRUE
                      WHEN 'USER_READ' THEN TRUE
                      WHEN 'USER_ROLE_ASSIGN' THEN TRUE
                      WHEN 'USER_STATUS_UPDATE' THEN TRUE
                      WHEN 'USER_PASSWORD_RESET' THEN TRUE
                      ELSE FALSE
                  END,
    is_assignable = CASE UPPER(name)
                        WHEN 'ANALYTICS_READ' THEN FALSE
                        WHEN 'PAYMENT_READ' THEN FALSE
                        WHEN 'RBAC_READ' THEN FALSE
                        WHEN 'RBAC_MANAGE' THEN FALSE
                        WHEN 'USER_CREATE' THEN FALSE
                        WHEN 'USER_UPDATE' THEN FALSE
                        WHEN 'USER_READ' THEN FALSE
                        WHEN 'USER_ROLE_ASSIGN' THEN FALSE
                        WHEN 'USER_STATUS_UPDATE' THEN FALSE
                        WHEN 'USER_PASSWORD_RESET' THEN FALSE
                        ELSE TRUE
                    END;

CREATE TABLE IF NOT EXISTS rbac_audit_logs (
    id UUID PRIMARY KEY,
    actor_user_id UUID NULL,
    action VARCHAR(80) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id VARCHAR(80) NOT NULL,
    before_state TEXT NULL,
    after_state TEXT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rbac_audit_logs_target ON rbac_audit_logs (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_logs_actor ON rbac_audit_logs (actor_user_id);

CREATE TABLE user_auth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL,
    provider_user_id VARCHAR(255),
    email_at_provider VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_user_auth_providers_user_provider UNIQUE (user_id, provider),
    CONSTRAINT uk_user_auth_providers_provider_provider_user_id UNIQUE (provider, provider_user_id),
    CONSTRAINT chk_user_auth_providers_provider_user_id_required
        CHECK (
            provider = 'LOCAL'
            OR provider_user_id IS NOT NULL
        )
);

CREATE INDEX idx_user_auth_providers_user_id ON user_auth_providers(user_id);
CREATE INDEX idx_user_auth_providers_provider ON user_auth_providers(provider);

INSERT INTO user_auth_providers (user_id, provider, provider_user_id, email_at_provider)
SELECT id, provider, provider_id, email
FROM users;

ALTER TABLE users
DROP COLUMN provider,
DROP COLUMN provider_id;

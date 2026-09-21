CREATE TABLE admin_users (
    id            UUID PRIMARY KEY,
    username      VARCHAR(60)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- El hash viene de la variable ADMIN_PASSWORD_HASH (placeholder de Flyway). Nunca texto plano.
INSERT INTO admin_users (id, username, password_hash)
VALUES (gen_random_uuid(), '${admin_username}', '${admin_password_hash}');

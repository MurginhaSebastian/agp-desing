CREATE TABLE products (
    id           UUID PRIMARY KEY,
    name         VARCHAR(120)  NOT NULL,
    slug         VARCHAR(140)  NOT NULL UNIQUE,
    description  VARCHAR(2000) NOT NULL DEFAULT '',
    price_cents  BIGINT        NOT NULL CHECK (price_cents > 0),
    currency     VARCHAR(3)    NOT NULL,
    width_cm     INTEGER       NOT NULL CHECK (width_cm > 0),
    height_cm    INTEGER       NOT NULL CHECK (height_cm > 0),
    technique    VARCHAR(80)   NOT NULL,
    image_url    VARCHAR(500)  NOT NULL,
    status       VARCHAR(20)   NOT NULL,
    featured     BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ   NOT NULL,
    updated_at   TIMESTAMPTZ   NOT NULL
);

CREATE INDEX idx_products_status ON products (status);
CREATE INDEX idx_products_featured ON products (featured) WHERE featured;

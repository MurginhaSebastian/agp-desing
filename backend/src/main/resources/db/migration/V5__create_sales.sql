-- Ventas cerradas por WhatsApp y apuntadas a mano en el panel. Solo las ve el taller: la API
-- solo las entrega con sesión de administrador y la tabla nace con RLS activado.
CREATE TABLE sales (
    id              UUID          PRIMARY KEY,
    -- La obra del catálogo, si la hay. Borrar la obra no borra sus ventas: se quedan sin obra y
    -- conservan en `item` el nombre con el que se vendió.
    product_id      UUID          REFERENCES products(id) ON DELETE SET NULL,
    item            VARCHAR(120)  NOT NULL,
    detail          VARCHAR(2000) NOT NULL DEFAULT '',
    quantity        INTEGER       NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    total_cents     BIGINT        NOT NULL CHECK (total_cents > 0),
    advance_cents   BIGINT        NOT NULL DEFAULT 0 CHECK (advance_cents >= 0),
    payment_method  VARCHAR(20)   NOT NULL,
    status          VARCHAR(20)   NOT NULL,
    customer_name   VARCHAR(80)   NOT NULL,
    customer_phone  VARCHAR(15)   NOT NULL,
    sale_date       DATE          NOT NULL,
    delivery_date   DATE,
    created_at      TIMESTAMPTZ   NOT NULL,
    updated_at      TIMESTAMPTZ   NOT NULL,
    CHECK (advance_cents <= total_cents),
    CHECK (delivery_date IS NULL OR delivery_date >= sale_date)
);

CREATE INDEX idx_sales_sale_date ON sales (sale_date);
CREATE INDEX idx_sales_product_id ON sales (product_id);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

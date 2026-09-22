-- Ajustes de la web editables desde el panel. Clave/valor a propósito: añadir un
-- ajuste nuevo no exige otra migración, solo una clave más.
CREATE TABLE site_settings (
    setting_key   VARCHAR(60)  PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL DEFAULT '',
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Vacío = la portada se queda tipográfica, sin imagen.
INSERT INTO site_settings (setting_key, setting_value) VALUES ('hero_image_url', '');

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

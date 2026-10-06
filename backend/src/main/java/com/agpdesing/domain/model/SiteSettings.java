package com.agpdesing.domain.model;

/**
 * Ajustes editables de la web. Hoy solo la imagen de la portada, pero es un
 * objeto de valor: añadir otro ajuste no cambia la forma de guardarlo.
 * Vacío es válido y significa "sin imagen": la portada se queda tipográfica.
 */
public record SiteSettings(String heroImageUrl) {

    public static final int URL_MAX = UrlPublica.MAX;

    public SiteSettings {
        heroImageUrl = normalizeUrl(heroImageUrl);
    }

    public static SiteSettings empty() {
        return new SiteSettings("");
    }

    public boolean hasHeroImage() {
        return !heroImageUrl.isEmpty();
    }

    private static String normalizeUrl(String value) {
        // Vacía es válida (sin imagen); si no, la misma regla que la foto de una obra.
        if (value == null || value.isBlank()) return "";
        return UrlPublica.validar("heroImageUrl", value);
    }
}

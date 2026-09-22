package com.agpdesing.domain.model;

import com.agpdesing.domain.exception.DomainValidationException;

/**
 * Ajustes editables de la web. Hoy solo la imagen de la portada, pero es un
 * objeto de valor: añadir otro ajuste no cambia la forma de guardarlo.
 * Vacío es válido y significa "sin imagen": la portada se queda tipográfica.
 */
public record SiteSettings(String heroImageUrl) {

    public static final int URL_MAX = 500;

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
        String v = value == null ? "" : value.strip();
        if (v.isEmpty()) return v;
        boolean ok = v.startsWith("https://") || v.startsWith("http://") || v.startsWith("/");
        if (!ok) throw new DomainValidationException("heroImageUrl", "Debe ser una URL http(s) o una ruta que empiece por /");
        if (v.length() > URL_MAX) throw new DomainValidationException("heroImageUrl", "Máximo " + URL_MAX + " caracteres");
        return v;
    }
}

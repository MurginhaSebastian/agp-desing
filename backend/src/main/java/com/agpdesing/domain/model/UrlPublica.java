package com.agpdesing.domain.model;

import com.agpdesing.domain.exception.DomainValidationException;

/**
 * La regla de una dirección de imagen que se pinta en la web (la foto de una obra, la de la
 * portada): `http(s)://` o una ruta que empiece por `/`, **con algo detrás**, y como mucho 500
 * caracteres. Antes estaba copiada en `Product` y `SiteSettings` y, a diferencia del formulario,
 * daba por buena una dirección vacía como `/` o `https://`.
 */
public final class UrlPublica {

    public static final int MAX = 500;

    private static final String[] PREFIJOS = {"https://", "http://", "/"};

    private UrlPublica() {
    }

    /**
     * @param campo el nombre del campo, para señalarlo en el formulario si no vale
     * @return la dirección sin espacios alrededor
     */
    public static String validar(String campo, String valor) {
        String v = valor == null ? "" : valor.strip();
        if (!tieneAlgoTrasElPrefijo(v)) {
            throw new DomainValidationException(campo, "Debe ser una URL http(s) o una ruta que empiece por /");
        }
        if (v.length() > MAX) throw new DomainValidationException(campo, "Máximo " + MAX + " caracteres");
        return v;
    }

    private static boolean tieneAlgoTrasElPrefijo(String v) {
        for (String prefijo : PREFIJOS) {
            if (v.startsWith(prefijo)) return v.length() > prefijo.length();
        }
        return false;
    }
}

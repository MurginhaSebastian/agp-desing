package com.agpdesing.infrastructure.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Leído de `app.storage.*`, que a su vez viene de SUPABASE_URL, SUPABASE_SERVICE_KEY y
 * SUPABASE_BUCKET.
 *
 * Nada es obligatorio al arrancar, a propósito: sin configurar, la web entera sigue
 * funcionando y lo único que falla es subir una foto, con un mensaje que lo explica. Obligarlo
 * dejaría el sitio caído por una variable que solo hace falta en el panel.
 *
 * `key` es la clave **secreta** de Supabase: da acceso total a la base de datos. Vive en el
 * entorno del proceso y no aparece en ningún log.
 */
@ConfigurationProperties(prefix = "app.storage")
public record SupabaseStorageProperties(String url, String key, String bucket) {

    public boolean configurado() {
        return url != null && !url.isBlank() && key != null && !key.isBlank() && bucket != null && !bucket.isBlank();
    }

    /** Sin la barra final, que duplicada rompe las rutas. */
    public String urlBase() {
        return url == null ? "" : url.replaceAll("/+$", "");
    }
}

package com.agpdesing.application.usecase.image;

/**
 * Formatos de imagen que se aceptan al subir, reconocidos por sus primeros bytes.
 *
 * Por qué no se usa el tipo que declara el navegador: lo manda quien llama, así que basta con
 * renombrar un archivo para que diga lo que uno quiera. Los bytes iniciales, en cambio, son
 * parte del archivo.
 *
 * Fuera de la lista a propósito:
 *  - SVG: es texto y puede llevar scripts dentro. El bucket es público, así que sería un
 *    archivo ejecutable alojado en un dominio de confianza.
 *  - HEIC (lo que sale de un iPhone por defecto): ningún navegador lo muestra, así que
 *    aceptarlo solo conseguiría que la foto no se viera. Se rechaza con un mensaje que explica
 *    qué hacer.
 */
public enum ImageFormat {
    JPEG("image/jpeg", ".jpg"),
    PNG("image/png", ".png"),
    WEBP("image/webp", ".webp");

    private final String tipoMime;
    private final String extension;

    ImageFormat(String tipoMime, String extension) {
        this.tipoMime = tipoMime;
        this.extension = extension;
    }

    public String tipoMime() {
        return tipoMime;
    }

    public String extension() {
        return extension;
    }
}

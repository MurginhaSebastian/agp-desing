package com.agpdesing.application.usecase.image;

/**
 * Quita de la imagen los datos que van escondidos dentro del archivo: la ubicación GPS donde se
 * tomó la foto, el modelo del teléfono, la fecha exacta, a veces el número de serie de la cámara.
 * Una foto de celular publicada tal cual cuenta dónde se hizo, y eso puede ser la casa de un
 * cliente.
 *
 * Importante: **no se vuelve a comprimir la imagen**. No se descodifican los píxeles ni se
 * recodifican: se recorre el archivo por bloques y se tiran solo los bloques de datos. El dibujo
 * que sale es byte a byte el mismo que entró; lo único que falta es la ficha.
 *
 * Cada formato guarda la ficha en sitios distintos, así que cada uno tiene su limpiador
 * ({@link LimpiadorJpeg}, {@link LimpiadorPng}, {@link LimpiadorWebp}), que explica qué tira y
 * qué conserva. Esta clase solo elige el que toca.
 *
 * Si el archivo está mal formado y no se puede recorrer, **no se sube**
 * ({@link com.agpdesing.application.exception.NoSePudoLimpiarException}): es preferible un error
 * claro a publicar una foto cuyos datos no se han podido quitar.
 */
public final class LimpiadorDeMetadatos {

    private static final LimpiadorDeFormato JPEG = new LimpiadorJpeg();
    private static final LimpiadorDeFormato PNG = new LimpiadorPng();
    private static final LimpiadorDeFormato WEBP = new LimpiadorWebp();

    private LimpiadorDeMetadatos() {
    }

    public static byte[] limpiar(byte[] contenido, ImageFormat formato) {
        // Sin `default` a propósito: un formato nuevo en ImageFormat no compila hasta tener limpiador.
        LimpiadorDeFormato limpiador = switch (formato) {
            case JPEG -> JPEG;
            case PNG -> PNG;
            case WEBP -> WEBP;
        };
        return limpiador.limpiar(contenido);
    }
}

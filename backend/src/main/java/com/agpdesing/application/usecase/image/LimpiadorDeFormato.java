package com.agpdesing.application.usecase.image;

/**
 * Cómo quitar los datos escondidos de UN formato de imagen. Cada formato guarda su ficha en sitios
 * distintos, así que cada uno tiene su clase; {@link LimpiadorDeMetadatos} elige la que toca.
 *
 * Aceptar un formato nuevo = añadirlo a {@link ImageFormat}, a {@link DetectorDeImagen} y escribir
 * su limpiador. El `switch` de {@link LimpiadorDeMetadatos} no compila hasta que lo tiene.
 */
interface LimpiadorDeFormato {

    /**
     * @return el mismo archivo sin la ficha; los píxeles no se tocan
     * @throws com.agpdesing.application.exception.NoSePudoLimpiarException si el archivo no se puede recorrer
     */
    byte[] limpiar(byte[] contenido);
}

package com.agpdesing.application.port.out;

import java.util.Optional;

/**
 * Puerto de salida: hacer una copia reducida de una foto para el catálogo.
 *
 * La original se guarda tal cual (solo sin metadatos) y es la que se ve en la ficha y al ampliar.
 * Las tarjetas del catálogo y la portada se ven a unos cientos de píxeles: bajarse para eso una
 * foto de celular de varios MB es lo que hacía lento el catálogo en el móvil.
 */
public interface ReductorDeImagen {

    /**
     * @param imagen      la foto ya limpia (JPEG, PNG o WebP)
     * @param orientacion la orientación EXIF (1–8) que hay que aplicar a los píxeles; 1 = tal cual
     * @param anchoMax    ancho máximo de la copia, en píxeles; las más estrechas no se agrandan
     * @return la copia en JPEG, o vacío si este formato no se puede leer (hoy, WebP) o algo falla:
     *         la copia es una mejora, nunca un motivo para rechazar la subida
     */
    Optional<byte[]> reducir(byte[] imagen, int orientacion, int anchoMax);
}

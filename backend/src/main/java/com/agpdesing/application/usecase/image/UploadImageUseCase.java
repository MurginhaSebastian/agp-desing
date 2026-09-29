package com.agpdesing.application.usecase.image;

import com.agpdesing.application.port.out.ImageStorage;
import com.agpdesing.domain.exception.DomainValidationException;

import java.util.UUID;

/**
 * Subir una imagen desde el panel y devolver su dirección pública.
 *
 * Recibe los bytes, no el objeto del servidor web: así este caso de uso no depende de Spring
 * (`CleanArchitectureTest` lo verifica) y se puede probar con un array normal.
 *
 * Tres pasos, en este orden:
 *   1. reconocer el formato por los bytes, no por lo que diga el navegador;
 *   2. quitar los datos escondidos (GPS, modelo del teléfono);
 *   3. guardar con un nombre nuevo, sin rastro del nombre original.
 */
public class UploadImageUseCase {

    /** Lo que llega del formulario, ya leído. */
    public record ImagenNueva(byte[] contenido, String tipoDeclarado, String nombreOriginal) {}

    private final ImageStorage almacen;
    private final long maxBytes;

    public UploadImageUseCase(ImageStorage almacen, long maxBytes) {
        this.almacen = almacen;
        this.maxBytes = maxBytes;
    }

    /** @return la dirección pública de la imagen guardada */
    public String execute(ImagenNueva imagen) {
        byte[] contenido = imagen.contenido();
        if (contenido == null || contenido.length == 0) {
            throw new DomainValidationException("archivo", "No llegó ningún archivo. Vuelve a elegir la foto.");
        }
        if (contenido.length > maxBytes) {
            throw new DomainValidationException("archivo",
                    "La foto pesa " + enMegas(contenido.length) + " y el máximo son " + enMegas(maxBytes) + ".");
        }

        ImageFormat formato = DetectorDeImagen.detectar(contenido)
                .orElseThrow(() -> new FormatoNoAdmitidoException(mensajeDeFormato(contenido)));

        byte[] limpio = LimpiadorDeMetadatos.limpiar(contenido, formato);

        // Nombre nuevo: sin colisiones, sin problemas de caché al reemplazar una foto, y sin
        // arrastrar el nombre original, que a veces dice más de lo que uno cree.
        String nombre = UUID.randomUUID() + formato.extension();
        return almacen.guardar(nombre, formato.tipoMime(), limpio);
    }

    /** El archivo no es una imagen de las que se aceptan. */
    public static class FormatoNoAdmitidoException extends RuntimeException {
        public FormatoNoAdmitidoException(String message) {
            super(message);
        }
    }

    private static String mensajeDeFormato(byte[] contenido) {
        String queEs = DetectorDeImagen.describir(contenido);
        if (queEs.contains("HEIC")) {
            return "Eso es " + queEs + ", y los navegadores no la muestran. En el iPhone: Ajustes → Cámara → Formatos → "
                    + "«Más compatible», o comparte la foto por WhatsApp y sube la que llega, que ya es JPG.";
        }
        return "Eso es " + queEs + ". Solo se aceptan fotos en JPG, PNG o WebP.";
    }

    private static String enMegas(long bytes) {
        double megas = bytes / (1024.0 * 1024.0);
        return String.format(java.util.Locale.of("es", "PE"), "%.1f MB", megas);
    }
}

package com.agpdesing.application.usecase.image;

import com.agpdesing.application.exception.FormatoNoAdmitidoException;
import com.agpdesing.application.exception.StorageFailedException;
import com.agpdesing.application.port.out.ImageStorage;
import com.agpdesing.application.port.out.ReductorDeImagen;
import com.agpdesing.domain.exception.DomainValidationException;

import java.util.UUID;

/**
 * Subir una imagen desde el panel y devolver su dirección pública.
 *
 * Recibe los bytes, no el objeto del servidor web: así este caso de uso no depende de Spring
 * (`CleanArchitectureTest` lo verifica) y se puede probar con un array normal.
 *
 * Cuatro pasos, en este orden:
 *   1. reconocer el formato por los bytes, no por lo que diga el navegador;
 *   2. quitar los datos escondidos (GPS, modelo del teléfono);
 *   3. guardar con un nombre nuevo, sin rastro del nombre original;
 *   4. guardar al lado una copia reducida para el catálogo: `{nombre}.min.jpg`.
 *
 * La original no se recomprime nunca: es la que se ve en la ficha y al ampliar. La copia sale
 * de ella y la web la encuentra por el nombre (ver `fotoReducida` en el frontend); si falta,
 * la web usa la original, así que no poder hacerla no impide la subida.
 */
public class UploadImageUseCase {

    /** Lo que llega del formulario, ya leído. */
    public record ImagenNueva(byte[] contenido, String tipoDeclarado, String nombreOriginal) {}

    /** Ancho de la copia: cubre la foto más grande del catálogo (el carrusel de la portada) en pantallas 2×. */
    public static final int ANCHO_COPIA = 1200;
    /** Lo que se añade al nombre de la original para el de la copia. */
    public static final String SUFIJO_COPIA = ".min.jpg";

    private final ImageStorage almacen;
    private final ReductorDeImagen reductor;
    private final long maxBytes;

    public UploadImageUseCase(ImageStorage almacen, ReductorDeImagen reductor, long maxBytes) {
        this.almacen = almacen;
        this.reductor = reductor;
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
        String uuid = UUID.randomUUID().toString();
        String url = almacen.guardar(uuid + formato.extension(), formato.tipoMime(), limpio);
        guardarCopia(uuid, limpio, formato);
        return url;
    }

    /** La copia reducida. Si no se puede hacer o guardar, se sigue: la web usa la original. */
    private void guardarCopia(String uuid, byte[] limpio, ImageFormat formato) {
        // El JPEG limpio conserva la orientación del celular; la copia la aplica a los píxeles,
        // porque se escribe sin metadatos y si no saldría tumbada.
        int orientacion = formato == ImageFormat.JPEG ? LimpiadorJpeg.orientacionDe(limpio) : 1;
        reductor.reducir(limpio, orientacion, ANCHO_COPIA).ifPresent(copia -> {
            try {
                almacen.guardar(uuid + SUFIJO_COPIA, "image/jpeg", copia);
            } catch (StorageFailedException e) {
                // La original ya está guardada y la web sabe arreglárselas sin la copia.
            }
        });
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

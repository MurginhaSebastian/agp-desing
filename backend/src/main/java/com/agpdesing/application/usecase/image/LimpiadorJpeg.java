package com.agpdesing.application.usecase.image;

import com.agpdesing.application.exception.NoSePudoLimpiarException;

import java.io.ByteArrayOutputStream;

import static com.agpdesing.application.usecase.image.Bytes.leerEntero;
import static com.agpdesing.application.usecase.image.Bytes.texto;

/**
 * JPEG: se conserva `APP0` (JFIF, la cabecera básica), `APP2` (el perfil de color ICC: tirarlo
 * cambiaría los colores de la foto) y `APP14`. Se tiran `APP1` (EXIF y XMP, donde está el GPS),
 * `APP3`–`APP12`, `APP13` (IPTC), `APP15` y los comentarios. La orientación se rescata del EXIF
 * antes de tirarlo (ver abajo).
 */
final class LimpiadorJpeg implements LimpiadorDeFormato {

    private static final int[] SEGMENTOS_A_TIRAR = {
            0xE1, // APP1  — EXIF (GPS, cámara, fecha) y XMP
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEC, // APP3..APP12
            0xED, // APP13 — IPTC
            0xEF, // APP15
            0xFE, // COM   — comentario
    };

    @Override
    public byte[] limpiar(byte[] b) {
        var salida = new ByteArrayOutputStream(b.length);
        salida.write(b, 0, 2); // SOI: FF D8

        /*
         * Una excepción dentro del EXIF que se tira: la **orientación**.
         *
         * Los celulares guardan los píxeles tal como los captó el sensor y anotan aparte «esta
         * foto va girada». Si se borra esa anotación con el resto del EXIF, las fotos verticales
         * salen tumbadas y la tarjeta del catálogo además toma la proporción equivocada. Así que
         * se lee antes y se vuelve a escribir sola, en un bloque mínimo: la orientación se queda,
         * la ubicación no.
         */
        int orientacion = orientacionDe(b);
        if (orientacion > 1) salida.writeBytes(bloqueDeOrientacion(orientacion));

        int i = 2;
        while (true) {
            if (i + 1 >= b.length) throw new NoSePudoLimpiarException("el JPEG se corta antes de la imagen");
            if ((b[i] & 0xFF) != 0xFF) throw new NoSePudoLimpiarException("el JPEG tiene un bloque mal formado");

            // Puede haber bytes FF de relleno antes del identificador del bloque.
            int j = i;
            while (j + 1 < b.length && (b[j + 1] & 0xFF) == 0xFF) j++;
            int marca = b[j + 1] & 0xFF;
            i = j;

            // A partir de aquí vienen los datos de la imagen: se copia todo lo que queda igual.
            if (marca == 0xDA) {
                salida.write(b, i, b.length - i);
                return salida.toByteArray();
            }
            // Bloques sin longitud (relleno y reinicios).
            if (marca == 0x01 || (marca >= 0xD0 && marca <= 0xD7)) {
                salida.write(b, i, 2);
                i += 2;
                continue;
            }
            if (i + 3 >= b.length) throw new NoSePudoLimpiarException("el JPEG se corta en medio de un bloque");
            int largo = ((b[i + 2] & 0xFF) << 8) | (b[i + 3] & 0xFF);
            if (largo < 2 || i + 2 + largo > b.length) throw new NoSePudoLimpiarException("un bloque del JPEG dice un tamaño imposible");

            if (!seTira(marca)) salida.write(b, i, 2 + largo);
            i += 2 + largo;
        }
    }

    /**
     * Busca la orientación (etiqueta 0x0112 del primer directorio EXIF) dentro de los bloques
     * APP1 del JPEG. Devuelve 1 (sin giro) si no la encuentra o si algo no cuadra: ante la duda,
     * no se inventa una rotación.
     */
    private static int orientacionDe(byte[] b) {
        int i = 2;
        while (i + 3 < b.length) {
            if ((b[i] & 0xFF) != 0xFF) return 1;
            int marca = b[i + 1] & 0xFF;
            if (marca == 0xDA || marca == 0xD9) return 1; // empiezan los datos de la imagen
            if (marca == 0x01 || (marca >= 0xD0 && marca <= 0xD7)) {
                i += 2;
                continue;
            }
            int largo = ((b[i + 2] & 0xFF) << 8) | (b[i + 3] & 0xFF);
            if (largo < 2 || i + 2 + largo > b.length) return 1;

            if (marca == 0xE1 && largo > 14 && texto(b, i + 4, 4).equals("Exif")) {
                int valor = buscarOrientacion(b, i + 10, i + 2 + largo); // tras "Exif\0\0"
                if (valor >= 1 && valor <= 8) return valor;
            }
            i += 2 + largo;
        }
        return 1;
    }

    /** `desde` apunta al inicio de la cabecera TIFF (II/MM), que es donde empiezan los offsets. */
    private static int buscarOrientacion(byte[] b, int desde, int hasta) {
        if (desde + 8 > hasta) return 1;
        String orden = texto(b, desde, 2);
        boolean granPrimero = orden.equals("MM");
        if (!granPrimero && !orden.equals("II")) return 1;

        long offsetIfd = leerEntero(b, desde + 4, 4, granPrimero);
        int ifd = (int) (desde + offsetIfd);
        if (ifd < desde || ifd + 2 > hasta) return 1;

        int entradas = (int) leerEntero(b, ifd, 2, granPrimero);
        for (int n = 0; n < entradas; n++) {
            int e = ifd + 2 + n * 12;
            if (e + 12 > hasta) return 1;
            int etiqueta = (int) leerEntero(b, e, 2, granPrimero);
            if (etiqueta == 0x0112) {
                int tipo = (int) leerEntero(b, e + 2, 2, granPrimero);
                if (tipo != 3) return 1; // SHORT; cualquier otra cosa es un archivo raro
                return (int) leerEntero(b, e + 8, 2, granPrimero);
            }
        }
        return 1;
    }

    /** Un APP1 mínimo que solo dice la orientación. Se escribe siempre en orden MM (big-endian). */
    private static byte[] bloqueDeOrientacion(int orientacion) {
        byte[] carga = new byte[] {
                'E', 'x', 'i', 'f', 0, 0,
                'M', 'M', 0, 42, 0, 0, 0, 8,          // cabecera TIFF: orden, 42, offset al IFD0
                0, 1,                                  // una sola entrada
                0x01, 0x12, 0, 3, 0, 0, 0, 1,          // etiqueta 0x0112, tipo SHORT, un valor
                (byte) ((orientacion >> 8) & 0xFF), (byte) (orientacion & 0xFF), 0, 0,
                0, 0, 0, 0,                            // no hay más directorios
        };
        int largo = carga.length + 2;
        var salida = new ByteArrayOutputStream(largo + 2);
        salida.write(0xFF);
        salida.write(0xE1);
        salida.write((largo >> 8) & 0xFF);
        salida.write(largo & 0xFF);
        salida.writeBytes(carga);
        return salida.toByteArray();
    }

    private static boolean seTira(int marca) {
        for (int m : SEGMENTOS_A_TIRAR) {
            if (m == marca) return true;
        }
        return false;
    }
}

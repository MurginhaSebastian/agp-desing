package com.agpdesing.application.usecase.image;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

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
 * Qué se conserva y por qué:
 *  - JPEG: se conserva `APP0` (JFIF, la cabecera básica) y `APP2` (el perfil de color ICC:
 *    tirarlo cambiaría los colores de la foto). Se tira `APP1` (EXIF y XMP, donde está el GPS),
 *    `APP13` (IPTC) y los comentarios.
 *  - PNG: se tiran `eXIf`, `tEXt`, `zTXt` e `iTXt`. Lo demás se copia igual, con su CRC intacto.
 *  - WebP: se tiran los bloques `EXIF` y `XMP `, se recalcula el tamaño del contenedor y se
 *    apagan los avisos correspondientes en `VP8X`.
 *
 * Si el archivo está mal formado y no se puede recorrer, **no se sube**: es preferible un error
 * claro a publicar una foto cuyos datos no se han podido quitar.
 */
public final class LimpiadorDeMetadatos {

    /** El archivo no se pudo recorrer, así que no hay garantía de haberle quitado los datos. */
    public static class NoSePudoLimpiarException extends RuntimeException {
        public NoSePudoLimpiarException(String message) {
            super(message);
        }
    }

    private LimpiadorDeMetadatos() {
    }

    public static byte[] limpiar(byte[] contenido, ImageFormat formato) {
        return switch (formato) {
            case JPEG -> limpiarJpeg(contenido);
            case PNG -> limpiarPng(contenido);
            case WEBP -> limpiarWebp(contenido);
        };
    }

    // ---------------------------------------------------------------- JPEG

    private static final int[] SEGMENTOS_A_TIRAR = {
            0xE1, // APP1  — EXIF (GPS, cámara, fecha) y XMP
            0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEC, // APP3..APP12
            0xED, // APP13 — IPTC
            0xEF, // APP15
            0xFE, // COM   — comentario
    };

    private static byte[] limpiarJpeg(byte[] b) {
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

    private static long leerEntero(byte[] b, int i, int bytes, boolean granPrimero) {
        long v = 0;
        for (int n = 0; n < bytes; n++) {
            int octeto = b[i + (granPrimero ? n : bytes - 1 - n)] & 0xFF;
            v = (v << 8) | octeto;
        }
        return v;
    }

    private static String texto(byte[] b, int desde, int largo) {
        if (desde < 0 || desde + largo > b.length) return "";
        return new String(b, desde, largo, StandardCharsets.ISO_8859_1);
    }

    private static boolean seTira(int marca) {
        for (int m : SEGMENTOS_A_TIRAR) {
            if (m == marca) return true;
        }
        return false;
    }

    // ---------------------------------------------------------------- PNG

    private static final java.util.Set<String> BLOQUES_PNG_A_TIRAR = java.util.Set.of("eXIf", "tEXt", "zTXt", "iTXt");

    private static byte[] limpiarPng(byte[] b) {
        var salida = new ByteArrayOutputStream(b.length);
        salida.write(b, 0, 8); // la firma

        int i = 8;
        while (i + 8 <= b.length) {
            long largo = leerEnteroGrande(b, i);
            String tipo = new String(b, i + 4, 4, StandardCharsets.US_ASCII);
            long total = 12 + largo; // longitud + tipo + datos + CRC
            if (largo < 0 || i + total > b.length) throw new NoSePudoLimpiarException("un bloque del PNG dice un tamaño imposible");

            if (!BLOQUES_PNG_A_TIRAR.contains(tipo)) salida.write(b, i, (int) total);
            i += (int) total;
            if ("IEND".equals(tipo)) return salida.toByteArray();
        }
        throw new NoSePudoLimpiarException("el PNG no termina como debería");
    }

    // ---------------------------------------------------------------- WebP

    private static final int AVISO_EXIF = 0x08;
    private static final int AVISO_XMP = 0x04;

    private static byte[] limpiarWebp(byte[] b) {
        var cuerpo = new ByteArrayOutputStream(b.length);
        cuerpo.write(b, 8, 4); // "WEBP"

        int i = 12;
        while (i + 8 <= b.length) {
            String tipo = new String(b, i, 4, StandardCharsets.US_ASCII);
            long largo = leerEnteroPequeno(b, i + 4);
            long conRelleno = largo + (largo % 2); // los bloques se alinean a par
            if (largo < 0 || i + 8 + conRelleno > b.length) throw new NoSePudoLimpiarException("un bloque del WebP dice un tamaño imposible");

            if ("EXIF".equals(tipo) || "XMP ".equals(tipo)) {
                i += (int) (8 + conRelleno);
                continue;
            }
            if ("VP8X".equals(tipo) && largo >= 1) {
                // Apagar los avisos de «aquí hay EXIF» y «aquí hay XMP», que ya no es verdad.
                byte[] trozo = new byte[(int) (8 + conRelleno)];
                System.arraycopy(b, i, trozo, 0, trozo.length);
                trozo[8] = (byte) (trozo[8] & ~(AVISO_EXIF | AVISO_XMP));
                cuerpo.write(trozo, 0, trozo.length);
            } else {
                cuerpo.write(b, i, (int) (8 + conRelleno));
            }
            i += (int) (8 + conRelleno);
        }
        if (i != b.length) throw new NoSePudoLimpiarException("el WebP tiene bytes de sobra al final");

        byte[] datos = cuerpo.toByteArray();
        var salida = new ByteArrayOutputStream(8 + datos.length);
        salida.write('R'); salida.write('I'); salida.write('F'); salida.write('F');
        escribirEnteroPequeno(salida, datos.length); // el tamaño cambia al quitar bloques
        salida.write(datos, 0, datos.length);
        return salida.toByteArray();
    }

    // ---------------------------------------------------------------- números

    private static long leerEnteroGrande(byte[] b, int i) {
        return ((long) (b[i] & 0xFF) << 24) | ((b[i + 1] & 0xFF) << 16) | ((b[i + 2] & 0xFF) << 8) | (b[i + 3] & 0xFF);
    }

    private static long leerEnteroPequeno(byte[] b, int i) {
        return ((long) (b[i + 3] & 0xFF) << 24) | ((b[i + 2] & 0xFF) << 16) | ((b[i + 1] & 0xFF) << 8) | (b[i] & 0xFF);
    }

    private static void escribirEnteroPequeno(ByteArrayOutputStream salida, int valor) {
        salida.write(valor & 0xFF);
        salida.write((valor >> 8) & 0xFF);
        salida.write((valor >> 16) & 0xFF);
        salida.write((valor >> 24) & 0xFF);
    }
}

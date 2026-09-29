package com.agpdesing.application;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

/**
 * Imágenes de verdad, construidas en memoria para las pruebas. No se leen ni se escriben
 * archivos: todo son arrays de bytes.
 *
 * Las que llevan datos escondidos se fabrican metiendo el bloque a mano en una imagen real,
 * porque una foto de celular de verdad no se puede versionar en el repositorio (y menos una con
 * la ubicación de alguien dentro).
 */
final class ImagenesDePrueba {

    /** Texto reconocible que se mete dentro de los metadatos para poder buscarlo después. */
    static final String RASTRO_GPS = "GPSLatitude:-8.111 GPSLongitude:-79.028";

    private ImagenesDePrueba() {
    }

    static byte[] jpeg(int ancho, int alto) {
        return dibujar("jpg", ancho, alto);
    }

    static byte[] png(int ancho, int alto) {
        return dibujar("png", ancho, alto);
    }

    /** JPEG con un bloque APP1 (EXIF) metido justo después de la cabecera, como haría una cámara. */
    static byte[] jpegConExif(int ancho, int alto) {
        byte[] base = jpeg(ancho, alto);
        byte[] carga = ("Exif\0\0" + RASTRO_GPS).getBytes(StandardCharsets.ISO_8859_1);
        int largo = carga.length + 2; // la longitud se cuenta a sí misma

        var salida = new ByteArrayOutputStream();
        salida.write(base, 0, 2); // SOI
        salida.write(0xFF);
        salida.write(0xE1); // APP1
        salida.write((largo >> 8) & 0xFF);
        salida.write(largo & 0xFF);
        salida.write(carga, 0, carga.length);
        salida.write(base, 2, base.length - 2);
        return salida.toByteArray();
    }

    /**
     * JPEG como el que sale de un celular: los píxeles en horizontal, más la anotación
     * «esta foto va girada» (orientación 6) y la ubicación. Al limpiarla debe irse la ubicación
     * y quedarse el giro, o la foto saldría tumbada.
     *
     * El EXIF se escribe a mano en orden II (little-endian), que es el que usan casi todas las
     * cámaras, para que la lectura se pruebe en el orden real y no solo en el fácil.
     */
    static byte[] jpegDeCelular(int ancho, int alto, int orientacion) {
        byte[] base = jpeg(ancho, alto);

        var exif = new ByteArrayOutputStream();
        exif.writeBytes("Exif\0\0".getBytes(StandardCharsets.ISO_8859_1));
        exif.writeBytes(new byte[] { 'I', 'I', 42, 0, 8, 0, 0, 0 }); // cabecera TIFF, offset 8
        exif.writeBytes(new byte[] { 2, 0 });                        // dos entradas
        // 0x0112 orientación, SHORT, 1 valor
        exif.writeBytes(new byte[] { 0x12, 0x01, 3, 0, 1, 0, 0, 0, (byte) orientacion, 0, 0, 0 });
        // 0x010E descripción, ASCII: ahí se mete el rastro de GPS para poder buscarlo
        byte[] rastro = (RASTRO_GPS + "\0").getBytes(StandardCharsets.ISO_8859_1);
        int offsetRastro = 8 + 2 + 24 + 4; // cabecera + nº entradas + entradas + siguiente IFD
        exif.writeBytes(new byte[] { 0x0E, 0x01, 2, 0,
                (byte) rastro.length, 0, 0, 0,
                (byte) offsetRastro, 0, 0, 0 });
        exif.writeBytes(new byte[] { 0, 0, 0, 0 }); // no hay más directorios
        exif.writeBytes(rastro);

        byte[] carga = exif.toByteArray();
        int largo = carga.length + 2;

        var salida = new ByteArrayOutputStream();
        salida.write(base, 0, 2); // SOI
        salida.write(0xFF);
        salida.write(0xE1);
        salida.write((largo >> 8) & 0xFF);
        salida.write(largo & 0xFF);
        salida.writeBytes(carga);
        salida.write(base, 2, base.length - 2);
        return salida.toByteArray();
    }

    /**
     * Lee la orientación de un JPEG, sea cual sea el orden de bytes de su EXIF. Se escribe a
     * mano en la prueba, sin reutilizar el código que se está comprobando: si los dos
     * compartieran el mismo error, la prueba lo aprobaría.
     *
     * Devuelve 1 cuando no hay anotación de giro.
     */
    static int orientacionDe(byte[] jpeg) {
        int i = 2;
        while (i + 3 < jpeg.length) {
            if ((jpeg[i] & 0xFF) != 0xFF) return 1;
            int marca = jpeg[i + 1] & 0xFF;
            if (marca == 0xDA || marca == 0xD9) return 1; // empiezan los datos de la imagen
            if (marca == 0x01 || (marca >= 0xD0 && marca <= 0xD7)) {
                i += 2;
                continue;
            }
            int largo = ((jpeg[i + 2] & 0xFF) << 8) | (jpeg[i + 3] & 0xFF);
            if (largo < 2 || i + 2 + largo > jpeg.length) return 1;

            if (marca == 0xE1 && largo > 16) {
                int tiff = i + 10; // tras el identificador "Exif\0\0"
                boolean mm = (jpeg[tiff] & 0xFF) == 'M';
                int ifd = tiff + (int) leer(jpeg, tiff + 4, 4, mm);
                if (ifd > 0 && ifd + 2 <= jpeg.length) {
                    int entradas = (int) leer(jpeg, ifd, 2, mm);
                    for (int n = 0; n < entradas; n++) {
                        int e = ifd + 2 + n * 12;
                        if (e + 12 > jpeg.length) break;
                        if (leer(jpeg, e, 2, mm) == 0x0112) return (int) leer(jpeg, e + 8, 2, mm);
                    }
                }
            }
            i += 2 + largo;
        }
        return 1;
    }

    private static long leer(byte[] b, int i, int bytes, boolean granPrimero) {
        long v = 0;
        for (int n = 0; n < bytes; n++) {
            v = (v << 8) | (b[i + (granPrimero ? n : bytes - 1 - n)] & 0xFF);
        }
        return v;
    }

    /** JPEG con un perfil de color (APP2), que NO debe desaparecer al limpiar. */
    static byte[] jpegConPerfilDeColor(int ancho, int alto) {
        byte[] base = jpeg(ancho, alto);
        byte[] carga = "ICC_PROFILE\0 perfil de color inventado".getBytes(StandardCharsets.ISO_8859_1);
        int largo = carga.length + 2;

        var salida = new ByteArrayOutputStream();
        salida.write(base, 0, 2);
        salida.write(0xFF);
        salida.write(0xE2); // APP2
        salida.write((largo >> 8) & 0xFF);
        salida.write(largo & 0xFF);
        salida.write(carga, 0, carga.length);
        salida.write(base, 2, base.length - 2);
        return salida.toByteArray();
    }

    /** PNG con un bloque eXIf metido antes del IEND. */
    static byte[] pngConExif(int ancho, int alto) {
        byte[] base = png(ancho, alto);
        byte[] bloque = bloquePng("eXIf", RASTRO_GPS.getBytes(StandardCharsets.ISO_8859_1));

        int iend = posicionDelIend(base);
        var salida = new ByteArrayOutputStream();
        salida.write(base, 0, iend);
        salida.write(bloque, 0, bloque.length);
        salida.write(base, iend, base.length - iend);
        return salida.toByteArray();
    }

    /**
     * WebP mínimo con VP8X (avisando de que lleva EXIF y XMP) y un bloque EXIF. No es una imagen
     * que se pueda mostrar: sirve para comprobar que el recorrido de bloques hace lo que dice.
     */
    static byte[] webpConExif() {
        var cuerpo = new ByteArrayOutputStream();
        cuerpo.write('W'); cuerpo.write('E'); cuerpo.write('B'); cuerpo.write('P');

        // VP8X: 10 bytes. El primero son los avisos; se encienden EXIF (0x08) y XMP (0x04).
        byte[] vp8x = new byte[10];
        vp8x[0] = (byte) (0x08 | 0x04);
        escribirBloqueWebp(cuerpo, "VP8X", vp8x);

        escribirBloqueWebp(cuerpo, "VP8 ", "pixeles inventados".getBytes(StandardCharsets.ISO_8859_1));
        escribirBloqueWebp(cuerpo, "EXIF", RASTRO_GPS.getBytes(StandardCharsets.ISO_8859_1));

        byte[] datos = cuerpo.toByteArray();
        var salida = new ByteArrayOutputStream();
        salida.write('R'); salida.write('I'); salida.write('F'); salida.write('F');
        escribirEnteroPequeno(salida, datos.length);
        salida.write(datos, 0, datos.length);
        return salida.toByteArray();
    }

    static byte[] svg() {
        return ("<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>")
                .getBytes(StandardCharsets.UTF_8);
    }

    /** Cabecera de una foto HEIC de iPhone: ...ftypheic... */
    static byte[] heic() {
        byte[] b = new byte[64];
        b[3] = 0x18;
        System.arraycopy("ftypheic".getBytes(StandardCharsets.ISO_8859_1), 0, b, 4, 8);
        System.arraycopy("mif1heic".getBytes(StandardCharsets.ISO_8859_1), 0, b, 16, 8);
        return b;
    }

    static byte[] gif() {
        byte[] b = new byte[32];
        System.arraycopy("GIF89a".getBytes(StandardCharsets.ISO_8859_1), 0, b, 0, 6);
        return b;
    }

    // ------------------------------------------------------------------ apoyo

    private static byte[] dibujar(String formato, int ancho, int alto) {
        var imagen = new BufferedImage(ancho, alto, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < ancho; x++) {
            for (int y = 0; y < alto; y++) {
                imagen.setRGB(x, y, (x * 7 + y * 13) % 0xFFFFFF);
            }
        }
        var salida = new ByteArrayOutputStream();
        try {
            if (!ImageIO.write(imagen, formato, salida)) {
                throw new IllegalStateException("Esta máquina no sabe escribir " + formato);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return salida.toByteArray();
    }

    private static byte[] bloquePng(String tipo, byte[] datos) {
        var salida = new ByteArrayOutputStream();
        int largo = datos.length;
        salida.write((largo >> 24) & 0xFF);
        salida.write((largo >> 16) & 0xFF);
        salida.write((largo >> 8) & 0xFF);
        salida.write(largo & 0xFF);
        byte[] nombre = tipo.getBytes(StandardCharsets.US_ASCII);
        salida.write(nombre, 0, 4);
        salida.write(datos, 0, datos.length);

        var crc = new CRC32();
        crc.update(nombre);
        crc.update(datos);
        long valor = crc.getValue();
        salida.write((int) ((valor >> 24) & 0xFF));
        salida.write((int) ((valor >> 16) & 0xFF));
        salida.write((int) ((valor >> 8) & 0xFF));
        salida.write((int) (valor & 0xFF));
        return salida.toByteArray();
    }

    private static int posicionDelIend(byte[] png) {
        for (int i = 8; i + 8 <= png.length; i++) {
            if (png[i + 4] == 'I' && png[i + 5] == 'E' && png[i + 6] == 'N' && png[i + 7] == 'D') return i;
        }
        throw new IllegalStateException("el PNG de prueba no tiene IEND");
    }

    private static void escribirBloqueWebp(ByteArrayOutputStream salida, String tipo, byte[] datos) {
        salida.write(tipo.getBytes(StandardCharsets.US_ASCII), 0, 4);
        escribirEnteroPequeno(salida, datos.length);
        salida.write(datos, 0, datos.length);
        if (datos.length % 2 == 1) salida.write(0); // los bloques se alinean a par
    }

    private static void escribirEnteroPequeno(ByteArrayOutputStream salida, int valor) {
        salida.write(valor & 0xFF);
        salida.write((valor >> 8) & 0xFF);
        salida.write((valor >> 16) & 0xFF);
        salida.write((valor >> 24) & 0xFF);
    }
}

package com.agpdesing.application.usecase.image;

import com.agpdesing.application.exception.NoSePudoLimpiarException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static com.agpdesing.application.usecase.image.Bytes.escribirEnteroPequeno;
import static com.agpdesing.application.usecase.image.Bytes.leerEnteroPequeno;

/**
 * WebP: se tiran los bloques `EXIF` y `XMP `, se recalcula el tamaño del contenedor y se apagan
 * los avisos correspondientes en `VP8X`.
 */
final class LimpiadorWebp implements LimpiadorDeFormato {

    private static final int AVISO_EXIF = 0x08;
    private static final int AVISO_XMP = 0x04;

    @Override
    public byte[] limpiar(byte[] b) {
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
}

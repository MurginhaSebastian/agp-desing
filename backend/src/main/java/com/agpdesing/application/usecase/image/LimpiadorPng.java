package com.agpdesing.application.usecase.image;

import com.agpdesing.application.exception.NoSePudoLimpiarException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;

import static com.agpdesing.application.usecase.image.Bytes.leerEnteroGrande;

/**
 * PNG: se tiran `eXIf`, `tEXt`, `zTXt` e `iTXt`. Lo demás se copia igual, con su CRC intacto.
 * Lo que venga después de `IEND` se descarta.
 */
final class LimpiadorPng implements LimpiadorDeFormato {

    private static final Set<String> BLOQUES_A_TIRAR = Set.of("eXIf", "tEXt", "zTXt", "iTXt");

    @Override
    public byte[] limpiar(byte[] b) {
        var salida = new ByteArrayOutputStream(b.length);
        salida.write(b, 0, 8); // la firma

        int i = 8;
        while (i + 8 <= b.length) {
            long largo = leerEnteroGrande(b, i);
            String tipo = new String(b, i + 4, 4, StandardCharsets.US_ASCII);
            long total = 12 + largo; // longitud + tipo + datos + CRC
            if (largo < 0 || i + total > b.length) throw new NoSePudoLimpiarException("un bloque del PNG dice un tamaño imposible");

            if (!BLOQUES_A_TIRAR.contains(tipo)) salida.write(b, i, (int) total);
            i += (int) total;
            if ("IEND".equals(tipo)) return salida.toByteArray();
        }
        throw new NoSePudoLimpiarException("el PNG no termina como debería");
    }
}

package com.agpdesing.application.usecase.image;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/** Leer y escribir números y textos dentro de un archivo, compartido por los limpiadores. */
final class Bytes {

    private Bytes() {
    }

    /** Entero de `bytes` octetos, en orden grande primero (MM) o pequeño primero (II). */
    static long leerEntero(byte[] b, int i, int bytes, boolean granPrimero) {
        long v = 0;
        for (int n = 0; n < bytes; n++) {
            int octeto = b[i + (granPrimero ? n : bytes - 1 - n)] & 0xFF;
            v = (v << 8) | octeto;
        }
        return v;
    }

    /** Entero de 4 octetos, grande primero (PNG). */
    static long leerEnteroGrande(byte[] b, int i) {
        return ((long) (b[i] & 0xFF) << 24) | ((b[i + 1] & 0xFF) << 16) | ((b[i + 2] & 0xFF) << 8) | (b[i + 3] & 0xFF);
    }

    /** Entero de 4 octetos, pequeño primero (WebP). */
    static long leerEnteroPequeno(byte[] b, int i) {
        return ((long) (b[i + 3] & 0xFF) << 24) | ((b[i + 2] & 0xFF) << 16) | ((b[i + 1] & 0xFF) << 8) | (b[i] & 0xFF);
    }

    static void escribirEnteroPequeno(ByteArrayOutputStream salida, int valor) {
        salida.write(valor & 0xFF);
        salida.write((valor >> 8) & 0xFF);
        salida.write((valor >> 16) & 0xFF);
        salida.write((valor >> 24) & 0xFF);
    }

    /** Texto ISO-8859-1 en esa posición, o "" si se sale del archivo. */
    static String texto(byte[] b, int desde, int largo) {
        if (desde < 0 || desde + largo > b.length) return "";
        return new String(b, desde, largo, StandardCharsets.ISO_8859_1);
    }
}

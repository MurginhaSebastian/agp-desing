package com.agpdesing.application.usecase.image;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * Qué es de verdad el archivo que llegó, mirando sus primeros bytes.
 *
 * Cada formato empieza por una marca fija:
 *   JPEG  FF D8 FF
 *   PNG   89 50 4E 47 0D 0A 1A 0A
 *   WebP  "RIFF" …cuatro bytes de tamaño… "WEBP"
 *
 * Los que se rechazan también se reconocen, para poder decirle a la persona qué pasó en vez de
 * un «formato no válido» a secas: HEIC de iPhone, GIF, SVG y PDF.
 */
public final class DetectorDeImagen {

    private DetectorDeImagen() {
    }

    /** Formato reconocido, o vacío si no es ninguno de los que se aceptan. */
    public static Optional<ImageFormat> detectar(byte[] b) {
        if (b == null || b.length < 12) return Optional.empty();

        if (empiezaPor(b, 0xFF, 0xD8, 0xFF)) return Optional.of(ImageFormat.JPEG);
        if (empiezaPor(b, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) return Optional.of(ImageFormat.PNG);
        if (texto(b, 0, 4).equals("RIFF") && texto(b, 8, 4).equals("WEBP")) return Optional.of(ImageFormat.WEBP);

        return Optional.empty();
    }

    /**
     * Nombre reconocible de lo que llegó, para el mensaje de error. Nunca devuelve lo que
     * declaró el navegador: solo lo que dicen los bytes.
     */
    public static String describir(byte[] b) {
        if (b == null || b.length == 0) return "un archivo vacío";
        if (b.length >= 12 && texto(b, 4, 8).startsWith("ftyp")) {
            String marca = texto(b, 8, 4);
            if (marca.startsWith("heic") || marca.startsWith("heix") || marca.startsWith("mif1") || marca.startsWith("msf1")) {
                return "una foto HEIC de iPhone";
            }
            if (marca.startsWith("avif") || marca.startsWith("avis")) return "una imagen AVIF";
            return "un vídeo o un contenedor MP4";
        }
        if (empiezaPor(b, 0x47, 0x49, 0x46, 0x38)) return "un GIF";
        if (empiezaPor(b, 0x25, 0x50, 0x44, 0x46)) return "un PDF";
        if (empiezaPor(b, 0x42, 0x4D)) return "un BMP";
        if (empiezaPor(b, 0x50, 0x4B, 0x03, 0x04)) return "un archivo comprimido (zip, docx…)";
        String inicio = texto(b, 0, Math.min(400, b.length)).trim().toLowerCase();
        if (inicio.startsWith("<?xml") || inicio.startsWith("<svg") || inicio.contains("<svg")) return "un SVG";
        return "un archivo que no es una imagen";
    }

    private static boolean empiezaPor(byte[] b, int... esperados) {
        if (b.length < esperados.length) return false;
        for (int i = 0; i < esperados.length; i++) {
            if ((b[i] & 0xFF) != esperados[i]) return false;
        }
        return true;
    }

    private static String texto(byte[] b, int desde, int largo) {
        if (desde + largo > b.length) return "";
        return new String(b, desde, largo, StandardCharsets.ISO_8859_1);
    }
}

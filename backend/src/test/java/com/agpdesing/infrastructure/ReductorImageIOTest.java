package com.agpdesing.infrastructure;

import com.agpdesing.infrastructure.imagen.ReductorImageIO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

/** La copia reducida del catálogo, con imágenes de verdad. */
class ReductorImageIOTest {

    private final ReductorImageIO reductor = new ReductorImageIO();

    private static byte[] codificar(BufferedImage img, String formato) throws IOException {
        var salida = new ByteArrayOutputStream();
        ImageIO.write(img, formato, salida);
        return salida.toByteArray();
    }

    private static BufferedImage leer(byte[] bytes) throws IOException {
        return ImageIO.read(new ByteArrayInputStream(bytes));
    }

    /** Fondo blanco con un cuadrado rojo en la esquina de arriba a la izquierda, para saber hacia dónde gira. */
    private static BufferedImage conMarca(int ancho, int alto) {
        var img = new BufferedImage(ancho, alto, BufferedImage.TYPE_INT_RGB);
        var g = img.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, ancho, alto);
        g.setColor(Color.RED);
        g.fillRect(0, 0, ancho / 4, alto / 4);
        g.dispose();
        return img;
    }

    private static boolean esRojo(int rgb) {
        Color c = new Color(rgb);
        return c.getRed() > 180 && c.getGreen() < 80 && c.getBlue() < 80;
    }

    @Test
    @DisplayName("una foto grande baja a 1200 de ancho, mantiene la proporción y sale en JPEG mucho más ligera")
    void reduce() throws IOException {
        byte[] original = codificar(conMarca(3000, 2000), "png");
        byte[] copia = reductor.reducir(original, 1, 1200).orElseThrow();

        BufferedImage leida = leer(copia);
        assertThat(leida.getWidth()).isEqualTo(1200);
        assertThat(leida.getHeight()).isEqualTo(800);
        assertThat(copia[0] & 0xFF).isEqualTo(0xFF); // JPEG: empieza por FF D8
        assertThat(copia[1] & 0xFF).isEqualTo(0xD8);
        assertThat(copia.length).isLessThan(original.length);
    }

    @Test
    @DisplayName("una foto más estrecha que el máximo no se agranda")
    void noAgranda() throws IOException {
        byte[] copia = reductor.reducir(codificar(conMarca(600, 400), "jpg"), 1, 1200).orElseThrow();
        assertThat(leer(copia).getWidth()).isEqualTo(600);
    }

    @Test
    @DisplayName("aplica la orientación del celular: con 6 (90° a la derecha) la marca pasa arriba a la derecha")
    void orienta() throws IOException {
        byte[] copia = reductor.reducir(codificar(conMarca(400, 200), "png"), 6, 1200).orElseThrow();
        BufferedImage leida = leer(copia);

        assertThat(leida.getWidth()).isEqualTo(200);
        assertThat(leida.getHeight()).isEqualTo(400);
        assertThat(esRojo(leida.getRGB(leida.getWidth() - 5, 5))).isTrue();
        assertThat(esRojo(leida.getRGB(5, 5))).isFalse();
    }

    @Test
    @DisplayName("con orientación girada, el ancho máximo se mide sobre la foto tal como se ve")
    void anchoVisible() throws IOException {
        // Guardada 3000 × 2000 pero vista en vertical: 2000 de ancho visible → 1200 × 1800.
        BufferedImage leida = leer(reductor.reducir(codificar(conMarca(3000, 2000), "png"), 6, 1200).orElseThrow());
        assertThat(leida.getWidth()).isEqualTo(1200);
        assertThat(leida.getHeight()).isEqualTo(1800);
    }

    @Test
    @DisplayName("una PNG transparente sale con el fondo de la web, no en negro")
    void pngTransparente() throws IOException {
        var img = new BufferedImage(100, 100, BufferedImage.TYPE_INT_ARGB); // todo transparente
        BufferedImage leida = leer(reductor.reducir(codificar(img, "png"), 1, 1200).orElseThrow());
        Color c = new Color(leida.getRGB(50, 50));
        assertThat(c.getRed()).isGreaterThan(200);
        assertThat(c.getGreen()).isGreaterThan(200);
    }

    @Test
    @DisplayName("lo que Java no sabe leer (WebP, basura) no da copia, sin lanzar nada")
    void sinCopia() {
        byte[] webp = "RIFF\0\0\0\0WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1);
        assertThat(reductor.reducir(webp, 1, 1200)).isEmpty();
        assertThat(reductor.reducir(new byte[] { 1, 2, 3 }, 1, 1200)).isEmpty();
    }
}

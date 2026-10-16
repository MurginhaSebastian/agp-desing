package com.agpdesing.infrastructure.imagen;

import com.agpdesing.application.port.out.ReductorDeImagen;
import org.springframework.stereotype.Component;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

/**
 * La copia reducida con ImageIO, que viene con Java: ninguna librería añadida.
 *
 * Lee JPEG y PNG. WebP no (Java no trae lector): esas fotos se quedan sin copia y la web usa la
 * original, que en WebP ya suele venir comprimida.
 */
@Component
public class ReductorImageIO implements ReductorDeImagen {

    /** Calidad del JPEG de la copia: a 1200 px no se distingue de la original y pesa una fracción. */
    static final float CALIDAD = 0.82f;
    /** Fondo para las PNG con transparencia: el JPEG no la tiene. Es el `silk` de la web. */
    private static final Color FONDO = new Color(0xEE, 0xE2, 0xD4);

    @Override
    public Optional<byte[]> reducir(byte[] imagen, int orientacion, int anchoMax) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imagen));
            if (original == null) return Optional.empty();

            // Con orientaciones 5–8 la foto se ve girada 90°: su ancho visible es su alto guardado.
            boolean girada = orientacion >= 5 && orientacion <= 8;
            int anchoVisible = girada ? original.getHeight() : original.getWidth();
            double escala = Math.min(1.0, (double) anchoMax / anchoVisible);

            BufferedImage reducida = escalar(original,
                    Math.max(1, (int) Math.round(original.getWidth() * escala)),
                    Math.max(1, (int) Math.round(original.getHeight() * escala)));
            return Optional.of(aJpeg(orientar(reducida, orientacion)));
        } catch (IOException | RuntimeException e) {
            return Optional.empty();
        }
    }

    /**
     * Reduce a la mitad en varios pasos y termina con bicúbico: de un solo golpe, una foto de
     * 4000 px a 1200 sale con dientes de sierra en los bordes finos del cuadro.
     */
    private static BufferedImage escalar(BufferedImage origen, int ancho, int alto) {
        BufferedImage actual = aRgb(origen);
        int w = actual.getWidth();
        int h = actual.getHeight();
        while (w / 2 >= ancho && h / 2 >= alto) {
            w /= 2;
            h /= 2;
            actual = dibujar(actual, w, h, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        }
        return (w == ancho && h == alto) ? actual : dibujar(actual, ancho, alto, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    }

    /** A RGB sin transparencia, sobre el fondo de la web. */
    private static BufferedImage aRgb(BufferedImage origen) {
        if (origen.getType() == BufferedImage.TYPE_INT_RGB) return origen;
        BufferedImage rgb = new BufferedImage(origen.getWidth(), origen.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.setColor(FONDO);
        g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
        g.drawImage(origen, 0, 0, null);
        g.dispose();
        return rgb;
    }

    private static BufferedImage dibujar(BufferedImage origen, int ancho, int alto, Object interpolacion) {
        BufferedImage destino = new BufferedImage(ancho, alto, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = destino.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, interpolacion);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(origen, 0, 0, ancho, alto, null);
        g.dispose();
        return destino;
    }

    /**
     * Aplica la orientación EXIF a los píxeles. La copia se escribe sin metadatos, así que sin
     * esto una foto de celular en vertical saldría tumbada.
     */
    static BufferedImage orientar(BufferedImage img, int orientacion) {
        int w = img.getWidth();
        int h = img.getHeight();
        // AffineTransform(m00, m10, m01, m11, m02, m12): x' = m00·x + m01·y + m02, y' = m10·x + m11·y + m12
        AffineTransform t = switch (orientacion) {
            case 2 -> new AffineTransform(-1, 0, 0, 1, w, 0);   // espejo horizontal
            case 3 -> new AffineTransform(-1, 0, 0, -1, w, h);  // 180°
            case 4 -> new AffineTransform(1, 0, 0, -1, 0, h);   // espejo vertical
            case 5 -> new AffineTransform(0, 1, 1, 0, 0, 0);    // transpuesta
            case 6 -> new AffineTransform(0, 1, -1, 0, h, 0);   // 90° a la derecha
            case 7 -> new AffineTransform(0, -1, -1, 0, h, w);  // transversa
            case 8 -> new AffineTransform(0, -1, 1, 0, 0, w);   // 90° a la izquierda
            default -> null;
        };
        if (t == null) return img;
        boolean girada = orientacion >= 5;
        BufferedImage destino = new BufferedImage(girada ? h : w, girada ? w : h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = destino.createGraphics();
        g.drawImage(img, t, null);
        g.dispose();
        return destino;
    }

    private static byte[] aJpeg(BufferedImage img) throws IOException {
        ImageWriter escritor = ImageIO.getImageWritersByFormatName("jpeg").next();
        ImageWriteParam ajustes = escritor.getDefaultWriteParam();
        ajustes.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        ajustes.setCompressionQuality(CALIDAD);
        ajustes.setProgressiveMode(ImageWriteParam.MODE_DEFAULT); // progresivo: en el móvil se ve antes
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        try (ImageOutputStream flujo = ImageIO.createImageOutputStream(salida)) {
            escritor.setOutput(flujo);
            escritor.write(null, new IIOImage(img, null, null), ajustes);
        } finally {
            escritor.dispose();
        }
        return salida.toByteArray();
    }
}

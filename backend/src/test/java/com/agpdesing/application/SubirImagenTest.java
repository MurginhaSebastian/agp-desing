package com.agpdesing.application;

import com.agpdesing.application.port.out.ImageStorage;
import com.agpdesing.application.exception.FormatoNoAdmitidoException;
import com.agpdesing.application.exception.NoSePudoLimpiarException;
import com.agpdesing.application.usecase.image.DetectorDeImagen;
import com.agpdesing.application.usecase.image.ImageFormat;
import com.agpdesing.application.usecase.image.LimpiadorDeMetadatos;
import com.agpdesing.application.usecase.image.UploadImageUseCase;
import com.agpdesing.domain.exception.DomainValidationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Subir una foto desde el panel: reconocer el formato, quitarle los datos escondidos y
 * guardarla con un nombre nuevo.
 */
class SubirImagenTest {

    /** Almacén de mentira: se queda con lo último que le pidieron guardar. */
    private static final class AlmacenFalso implements ImageStorage {
        String nombre;
        String tipoMime;
        byte[] contenido;

        @Override
        public String guardar(String nombre, String tipoMime, byte[] contenido) {
            this.nombre = nombre;
            this.tipoMime = tipoMime;
            this.contenido = contenido;
            return "https://ejemplo.supabase.co/storage/v1/object/public/productos/" + nombre;
        }
    }

    private static String comoTexto(byte[] b) {
        return new String(b, StandardCharsets.ISO_8859_1);
    }

    @Nested
    @DisplayName("Reconocer qué es el archivo")
    class Deteccion {

        @Test
        @DisplayName("acepta JPG, PNG y WebP por sus primeros bytes")
        void aceptaLosTres() {
            assertThat(DetectorDeImagen.detectar(ImagenesDePrueba.jpeg(8, 8))).contains(ImageFormat.JPEG);
            assertThat(DetectorDeImagen.detectar(ImagenesDePrueba.png(8, 8))).contains(ImageFormat.PNG);
            assertThat(DetectorDeImagen.detectar(ImagenesDePrueba.webpConExif())).contains(ImageFormat.WEBP);
        }

        @Test
        @DisplayName("no se cree el nombre ni el tipo que declara el navegador")
        void noSeCreeLoDeclarado() {
            // Un texto cualquiera al que alguien llamó «foto.jpg» y declaró como image/jpeg.
            byte[] texto = "esto no es una imagen, por mucho que se llame foto.jpg".getBytes(StandardCharsets.UTF_8);
            assertThat(DetectorDeImagen.detectar(texto)).isEmpty();
        }

        @Test
        @DisplayName("rechaza SVG, HEIC, GIF y archivos vacíos")
        void rechazaElResto() {
            assertThat(DetectorDeImagen.detectar(ImagenesDePrueba.svg())).isEmpty();
            assertThat(DetectorDeImagen.detectar(ImagenesDePrueba.heic())).isEmpty();
            assertThat(DetectorDeImagen.detectar(ImagenesDePrueba.gif())).isEmpty();
            assertThat(DetectorDeImagen.detectar(new byte[0])).isEmpty();
            assertThat(DetectorDeImagen.detectar(null)).isEmpty();
        }

        @Test
        @DisplayName("sabe decir qué era, para poder explicarlo")
        void describeLoQueEra() {
            assertThat(DetectorDeImagen.describir(ImagenesDePrueba.heic())).contains("HEIC");
            assertThat(DetectorDeImagen.describir(ImagenesDePrueba.svg())).contains("SVG");
            assertThat(DetectorDeImagen.describir(ImagenesDePrueba.gif())).contains("GIF");
            assertThat(DetectorDeImagen.describir(new byte[0])).contains("vacío");
        }
    }

    @Nested
    @DisplayName("Quitar los datos escondidos")
    class Limpieza {

        @Test
        @DisplayName("la foto sigue abriéndose y con las mismas medidas, pero sin la ubicación")
        void jpegSigueSiendoLaMismaFoto() throws IOException {
            byte[] sucia = ImagenesDePrueba.jpegConExif(40, 25);
            assertThat(comoTexto(sucia)).contains(ImagenesDePrueba.RASTRO_GPS); // de partida sí la lleva

            byte[] limpia = LimpiadorDeMetadatos.limpiar(sucia, ImageFormat.JPEG);

            assertThat(comoTexto(limpia)).doesNotContain(ImagenesDePrueba.RASTRO_GPS);
            assertThat(comoTexto(limpia)).doesNotContain("Exif");
            // Lo que importa: sigue siendo una imagen válida y del mismo tamaño.
            BufferedImage leida = ImageIO.read(new ByteArrayInputStream(limpia));
            assertThat(leida).isNotNull();
            assertThat(leida.getWidth()).isEqualTo(40);
            assertThat(leida.getHeight()).isEqualTo(25);
        }

        @Test
        @DisplayName("una foto de celular conserva el giro pero pierde la ubicación")
        void conservaElGiroDelCelular() throws IOException {
            // Orientación 6 = «girar 90°». Es lo que anota un iPhone al hacer una foto vertical.
            byte[] delCelular = ImagenesDePrueba.jpegDeCelular(200, 100, 6);
            assertThat(ImagenesDePrueba.orientacionDe(delCelular)).isEqualTo(6);
            assertThat(comoTexto(delCelular)).contains(ImagenesDePrueba.RASTRO_GPS);

            byte[] limpia = LimpiadorDeMetadatos.limpiar(delCelular, ImageFormat.JPEG);

            // Sin esto, las fotos verticales del celular saldrían tumbadas en la web.
            assertThat(ImagenesDePrueba.orientacionDe(limpia)).isEqualTo(6);
            assertThat(comoTexto(limpia)).doesNotContain(ImagenesDePrueba.RASTRO_GPS);
            assertThat(ImageIO.read(new ByteArrayInputStream(limpia))).isNotNull();
        }

        @Test
        @DisplayName("una foto sin giro no gana una anotación que no tenía")
        void sinGiroNoSeInventaNada() {
            byte[] limpia = LimpiadorDeMetadatos.limpiar(ImagenesDePrueba.jpegDeCelular(100, 100, 1), ImageFormat.JPEG);
            assertThat(comoTexto(limpia)).doesNotContain("Exif");
        }

        @Test
        @DisplayName("no se toca el perfil de color: tirarlo cambiaría los colores")
        void conservaElPerfilDeColor() {
            byte[] conPerfil = ImagenesDePrueba.jpegConPerfilDeColor(20, 20);
            byte[] limpia = LimpiadorDeMetadatos.limpiar(conPerfil, ImageFormat.JPEG);
            assertThat(comoTexto(limpia)).contains("ICC_PROFILE");
        }

        @Test
        @DisplayName("en un PNG también, y sigue abriéndose")
        void pngSigueSiendoLaMismaImagen() throws IOException {
            byte[] sucia = ImagenesDePrueba.pngConExif(30, 18);
            assertThat(comoTexto(sucia)).contains(ImagenesDePrueba.RASTRO_GPS);

            byte[] limpia = LimpiadorDeMetadatos.limpiar(sucia, ImageFormat.PNG);

            assertThat(comoTexto(limpia)).doesNotContain(ImagenesDePrueba.RASTRO_GPS);
            assertThat(comoTexto(limpia)).doesNotContain("eXIf");
            BufferedImage leida = ImageIO.read(new ByteArrayInputStream(limpia));
            assertThat(leida).isNotNull();
            assertThat(leida.getWidth()).isEqualTo(30);
            assertThat(leida.getHeight()).isEqualTo(18);
        }

        @Test
        @DisplayName("en un WebP se va el bloque, se apaga su aviso y cuadra el tamaño del contenedor")
        void webpQuedaCoherente() {
            byte[] limpia = LimpiadorDeMetadatos.limpiar(ImagenesDePrueba.webpConExif(), ImageFormat.WEBP);

            assertThat(comoTexto(limpia)).doesNotContain(ImagenesDePrueba.RASTRO_GPS);
            assertThat(comoTexto(limpia)).doesNotContain("EXIF");
            assertThat(comoTexto(limpia)).startsWith("RIFF").contains("WEBP").contains("VP8X");

            // El tamaño declarado en la cabecera tiene que coincidir con lo que queda detrás.
            long declarado = (limpia[4] & 0xFFL) | ((limpia[5] & 0xFFL) << 8)
                    | ((limpia[6] & 0xFFL) << 16) | ((limpia[7] & 0xFFL) << 24);
            assertThat(declarado).isEqualTo(limpia.length - 8L);

            // Y el aviso de «aquí hay EXIF/XMP» tiene que estar apagado (primer byte de VP8X).
            int avisos = limpia[20] & 0xFF;
            assertThat(avisos & 0x08).isZero();
            assertThat(avisos & 0x04).isZero();
        }

        @Test
        @DisplayName("una imagen dañada no se sube: antes que publicarla sin limpiar, se rechaza")
        void imagenDanadaSeRechaza() {
            byte[] jpegCortado = new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE1, 0x40 };
            assertThatThrownBy(() -> LimpiadorDeMetadatos.limpiar(jpegCortado, ImageFormat.JPEG))
                    .isInstanceOf(NoSePudoLimpiarException.class);
        }
    }

    @Nested
    @DisplayName("El caso de uso completo")
    class CasoDeUso {

        private final AlmacenFalso almacen = new AlmacenFalso();
        private final UploadImageUseCase subir = new UploadImageUseCase(almacen, 5 * 1024 * 1024);

        @Test
        @DisplayName("guarda con nombre nuevo, extensión del formato real y devuelve la dirección")
        void guardaYDevuelveLaDireccion() {
            // Declarado como JPEG a propósito, pero por dentro es un PNG.
            byte[] contenido = ImagenesDePrueba.png(16, 16);
            String url = subir.execute(new UploadImageUseCase.ImagenNueva(contenido, "image/jpeg", "MI FOTO DEL CUMPLE.jpg"));

            assertThat(almacen.tipoMime).isEqualTo("image/png");
            assertThat(almacen.nombre).endsWith(".png");
            assertThat(almacen.nombre).doesNotContain("CUMPLE"); // no se arrastra el nombre original
            assertThat(almacen.nombre).matches("[0-9a-f-]{36}\\.png");
            assertThat(url).endsWith(almacen.nombre);
        }

        @Test
        @DisplayName("dos subidas de la misma foto no chocan")
        void nombresDistintos() {
            byte[] contenido = ImagenesDePrueba.jpeg(10, 10);
            String una = subir.execute(new UploadImageUseCase.ImagenNueva(contenido, "image/jpeg", "foto.jpg"));
            String otra = subir.execute(new UploadImageUseCase.ImagenNueva(contenido, "image/jpeg", "foto.jpg"));
            assertThat(una).isNotEqualTo(otra);
        }

        @Test
        @DisplayName("lo que se guarda ya viene sin la ubicación")
        void loGuardadoVaLimpio() {
            byte[] contenido = ImagenesDePrueba.jpegConExif(20, 20);
            subir.execute(new UploadImageUseCase.ImagenNueva(contenido, "image/jpeg", "foto.jpg"));
            assertThat(comoTexto(almacen.contenido)).doesNotContain(ImagenesDePrueba.RASTRO_GPS);
        }

        @Test
        @DisplayName("una foto de más del tope se rechaza diciendo cuánto pesa")
        void demasiadoGrande() {
            byte[] gorda = new byte[6 * 1024 * 1024];
            System.arraycopy(ImagenesDePrueba.jpeg(8, 8), 0, gorda, 0, 20);
            assertThatThrownBy(() -> subir.execute(new UploadImageUseCase.ImagenNueva(gorda, "image/jpeg", "foto.jpg")))
                    .isInstanceOf(DomainValidationException.class)
                    // Perú escribe los decimales con punto, no con coma.
                    .hasMessageContaining("6.0 MB")
                    .hasMessageContaining("5.0 MB");
        }

        @Test
        @DisplayName("un archivo vacío se rechaza")
        void vacio() {
            assertThatThrownBy(() -> subir.execute(new UploadImageUseCase.ImagenNueva(new byte[0], "image/jpeg", "foto.jpg")))
                    .isInstanceOf(DomainValidationException.class);
        }

        @Test
        @DisplayName("un HEIC de iPhone se rechaza explicando cómo arreglarlo")
        void heicConAyuda() {
            assertThatThrownBy(() -> subir.execute(new UploadImageUseCase.ImagenNueva(ImagenesDePrueba.heic(), "image/heic", "IMG_0001.HEIC")))
                    .isInstanceOf(FormatoNoAdmitidoException.class)
                    .hasMessageContaining("HEIC")
                    .hasMessageContaining("Más compatible");
        }

        @Test
        @DisplayName("un SVG se rechaza aunque diga que es una imagen")
        void svgSeRechaza() {
            assertThatThrownBy(() -> subir.execute(new UploadImageUseCase.ImagenNueva(ImagenesDePrueba.svg(), "image/svg+xml", "logo.svg")))
                    .isInstanceOf(FormatoNoAdmitidoException.class)
                    .hasMessageContaining("SVG");
            assertThat(almacen.nombre).isNull(); // no llegó a guardarse nada
        }
    }
}

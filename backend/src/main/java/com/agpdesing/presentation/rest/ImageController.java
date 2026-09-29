package com.agpdesing.presentation.rest;

import com.agpdesing.application.usecase.image.UploadImageUseCase;
import com.agpdesing.presentation.dto.response.ImageResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;

/**
 * Subir una foto desde el panel. Exige ROLE_ADMIN — la regla vive en SecurityConfig, no aquí.
 *
 * Lo único que hace este controlador es convertir el archivo del formulario en bytes: la
 * validación, la limpieza de datos y el guardado son del caso de uso, que no sabe nada de HTTP.
 */
@RestController
@RequestMapping("/api/imagenes")
public class ImageController {

    private final UploadImageUseCase subir;

    public ImageController(UploadImageUseCase subir) {
        this.subir = subir;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageResponse subirUna(@RequestPart("archivo") MultipartFile archivo) {
        byte[] contenido;
        try {
            contenido = archivo.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer el archivo recibido", e);
        }
        String url = subir.execute(new UploadImageUseCase.ImagenNueva(
                contenido, archivo.getContentType(), archivo.getOriginalFilename()));
        return new ImageResponse(url);
    }
}

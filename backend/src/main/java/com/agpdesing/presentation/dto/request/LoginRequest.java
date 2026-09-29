package com.agpdesing.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * BCrypt solo mira los primeros 72 bytes de la contraseña: aceptar más no añade seguridad
 * y en las versiones nuevas de Spring Security lanza excepción (el usuario vería un 500).
 * El tope en bytes lo comprueba el caso de uso, porque una tilde ocupa dos.
 */
public record LoginRequest(
        @NotBlank @Size(max = 60) String username,
        @NotBlank @Size(max = 72) String password
) {}

package com.agpdesing.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * BCrypt solo mira los primeros 72 bytes de la contraseña: aceptar más no añade seguridad
 * y en las versiones nuevas de Spring Security lanza excepción (el usuario vería un 500).
 * Ese tope lo comprueba SOLO el caso de uso, en bytes (una tilde ocupa dos), y responde como a
 * una clave equivocada. Antes el DTO contaba además 72 caracteres y daba un 400 distinto: dos
 * reglas para lo mismo, y la del DTO, en la unidad equivocada.
 */
public record LoginRequest(
        @NotBlank @Size(max = 60) String username,
        @NotBlank String password
) {}

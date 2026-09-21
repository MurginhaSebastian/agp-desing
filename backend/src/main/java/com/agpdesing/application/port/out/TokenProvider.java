package com.agpdesing.application.port.out;

import java.time.Instant;
import java.util.Optional;

/** Puerto de salida: emitir y validar tokens. La implementación JWT vive en infraestructura. */
public interface TokenProvider {

    record IssuedToken(String value, Instant expiresAt) {}

    IssuedToken issue(String subject);

    /** Devuelve el subject si el token es válido (firma, expiración, emisor); vacío si no. */
    Optional<String> validate(String token);
}

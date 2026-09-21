package com.agpdesing.domain.model;

import java.util.Objects;

/** Único rol del sistema. Solo guarda el hash; el dominio nunca ve la contraseña en claro. */
public record AdminUser(String username, String passwordHash) {
    public AdminUser {
        Objects.requireNonNull(username);
        Objects.requireNonNull(passwordHash);
    }
}

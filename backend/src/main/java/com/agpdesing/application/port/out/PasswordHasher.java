package com.agpdesing.application.port.out;

/** Puerto de salida: comparar contraseña con hash. BCrypt en infraestructura. */
public interface PasswordHasher {
    boolean matches(String rawPassword, String hash);
}

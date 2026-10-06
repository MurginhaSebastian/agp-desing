package com.agpdesing.domain.exception;

public class InvalidCredentialsException extends DomainException {
    public InvalidCredentialsException() {
        super("Usuario o contraseña incorrectos");
    }
}

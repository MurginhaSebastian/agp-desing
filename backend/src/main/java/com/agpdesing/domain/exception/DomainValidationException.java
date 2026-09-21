package com.agpdesing.domain.exception;

/** Una invariante del dominio no se cumple. Lleva el campo para que la API pueda señalarlo. */
public class DomainValidationException extends RuntimeException {
    private final String field;

    public DomainValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String field() { return field; }
}

package com.agpdesing.domain.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(String key) {
        super("No existe un cuadro con identificador " + key);
    }
}

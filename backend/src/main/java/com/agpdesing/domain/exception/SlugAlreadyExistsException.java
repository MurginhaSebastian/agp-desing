package com.agpdesing.domain.exception;

public class SlugAlreadyExistsException extends RuntimeException {
    public SlugAlreadyExistsException(String slug) {
        super("Ya existe un cuadro con un nombre equivalente (" + slug + ")");
    }
}

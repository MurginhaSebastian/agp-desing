package com.agpdesing.application.exception;

/** El archivo no se pudo recorrer, así que no hay garantía de haberle quitado los datos escondidos. */
public class NoSePudoLimpiarException extends ApplicationException {
    public NoSePudoLimpiarException(String message) {
        super(message);
    }
}

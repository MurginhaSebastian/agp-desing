package com.agpdesing.application.exception;

/** El archivo no es una imagen de las que se aceptan (se mira por sus bytes, no por su nombre). */
public class FormatoNoAdmitidoException extends ApplicationException {
    public FormatoNoAdmitidoException(String message) {
        super(message);
    }
}

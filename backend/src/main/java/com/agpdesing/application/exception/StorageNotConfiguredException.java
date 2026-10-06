package com.agpdesing.application.exception;

/** El almacenamiento de fotos no está configurado (falta URL o clave). */
public class StorageNotConfiguredException extends ApplicationException {
    public StorageNotConfiguredException(String message) {
        super(message);
    }
}

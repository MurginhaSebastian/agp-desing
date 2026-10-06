package com.agpdesing.application.exception;

/** El almacenamiento de fotos respondió mal o no respondió. */
public class StorageFailedException extends ApplicationException {
    public StorageFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}

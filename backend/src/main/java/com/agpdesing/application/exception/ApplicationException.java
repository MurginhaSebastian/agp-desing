package com.agpdesing.application.exception;

/**
 * Base de los errores de los casos de uso que no son reglas del negocio: un archivo que no es una
 * foto, un almacén de fotos que no responde. Como los del dominio, no saben nada de HTTP.
 */
public abstract class ApplicationException extends RuntimeException {
    protected ApplicationException(String message, Throwable cause) {
        super(message, cause);
    }

    protected ApplicationException(String message) {
        super(message);
    }
}

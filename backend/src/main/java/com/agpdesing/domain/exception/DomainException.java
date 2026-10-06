package com.agpdesing.domain.exception;

/**
 * Base de los errores del dominio: una regla del negocio no se cumple (un dato inválido, una obra
 * que no existe, un nombre repetido, credenciales que no valen). No sabe nada de HTTP: la
 * traducción a códigos de respuesta vive en `GlobalExceptionHandler`.
 */
public abstract class DomainException extends RuntimeException {
    protected DomainException(String message) {
        super(message);
    }
}

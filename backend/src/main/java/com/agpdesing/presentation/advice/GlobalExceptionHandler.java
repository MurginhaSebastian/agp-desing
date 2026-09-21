package com.agpdesing.presentation.advice;

import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.exception.InvalidCredentialsException;
import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Convierte excepciones en RFC 7807 (ProblemDetail). Nunca expone stack traces.
 * El campo "errors" (mapa campo -> mensaje) es lo que el frontend pinta bajo cada input.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail onBeanValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Revisa los campos marcados");
        pd.setTitle("Datos inválidos");
        pd.setProperty("errors", errors);
        return pd;
    }

    @ExceptionHandler(DomainValidationException.class)
    ProblemDetail onDomainValidation(DomainValidationException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        pd.setTitle("Datos inválidos");
        pd.setProperty("errors", Map.of(ex.field(), ex.getMessage()));
        return pd;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail onUnreadable(HttpMessageNotReadableException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "El cuerpo de la petición no es JSON válido");
        pd.setTitle("Petición malformada");
        return pd;
    }

    @ExceptionHandler(ProductNotFoundException.class)
    ProblemDetail onNotFound(ProductNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("No encontrado");
        return pd;
    }

    @ExceptionHandler(SlugAlreadyExistsException.class)
    ProblemDetail onConflict(SlugAlreadyExistsException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Conflicto");
        pd.setProperty("errors", Map.of("name", ex.getMessage()));
        return pd;
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    ProblemDetail onBadCredentials(InvalidCredentialsException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        pd.setTitle("No autorizado");
        return pd;
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail onUnexpected(Exception ex) {
        // Se registra en el log del servidor; al cliente no le llega el detalle.
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Algo salió mal. Inténtalo de nuevo.");
        pd.setTitle("Error interno");
        return pd;
    }
}

package com.agpdesing.presentation.advice;

import com.agpdesing.application.exception.FormatoNoAdmitidoException;
import com.agpdesing.application.exception.NoSePudoLimpiarException;
import com.agpdesing.application.exception.StorageFailedException;
import com.agpdesing.application.exception.StorageNotConfiguredException;
import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.exception.InvalidCredentialsException;
import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.presentation.ratelimit.DemasiadasSubidasException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Convierte excepciones en RFC 7807 (ProblemDetail). Nunca expone stack traces.
 * El campo "errors" (mapa campo -> mensaje) es lo que el frontend pinta bajo cada input.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    /**
     * /api/products/no-es-uuid: un id con formato inválido es un recurso que no existe, no un 500.
     * No se devuelve lo que escribió el visitante: no hay motivo para hacerle eco a una entrada ajena.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail onBadPathVariable(MethodArgumentTypeMismatchException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "No existe un cuadro con ese identificador");
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

    /*
     * Subida de fotos. Sin estos manejadores, todo esto caería en el comodín de abajo y la
     * persona vería «Algo salió mal» cuando el problema es que la foto pesa demasiado.
     * El de MaxUploadSizeExceededException va primero porque hereda de MultipartException.
     */

    /** La foto supera el tope de `spring.servlet.multipart.max-file-size`. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ProblemDetail onDemasiadoGrande(MaxUploadSizeExceededException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.PAYLOAD_TOO_LARGE,
                "La foto pesa más de lo permitido. Reduce su tamaño y vuelve a intentarlo.");
        pd.setTitle("Foto demasiado grande");
        pd.setProperty("errors", Map.of("archivo", "La foto pesa más de lo permitido."));
        return pd;
    }

    /** No llegó el archivo, o el envío venía mal formado. */
    @ExceptionHandler({ MultipartException.class, MissingServletRequestPartException.class,
            MissingServletRequestParameterException.class })
    ProblemDetail onEnvioMalFormado(Exception ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "No llegó ninguna foto. Vuelve a elegir el archivo.");
        pd.setTitle("Falta el archivo");
        pd.setProperty("errors", Map.of("archivo", "No llegó ninguna foto."));
        return pd;
    }

    /**
     * La petición no vino como envío de formulario con archivo. Sin esto acababa en el comodín
     * de abajo y salía un 500 con «Algo salió mal», que no ayuda a nadie.
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ProblemDetail onTipoDePeticionNoAdmitido(HttpMediaTypeNotSupportedException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "La petición no llegó como un envío de archivo.");
        pd.setTitle("Envío no admitido");
        pd.setProperty("errors", Map.of("archivo", "La petición no llegó como un envío de archivo."));
        return pd;
    }

    /** El archivo no es una imagen de las que se aceptan (se mira por sus bytes, no por su nombre). */
    @ExceptionHandler(FormatoNoAdmitidoException.class)
    ProblemDetail onFormatoNoAdmitido(FormatoNoAdmitidoException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage());
        pd.setTitle("Formato no admitido");
        pd.setProperty("errors", Map.of("archivo", ex.getMessage()));
        return pd;
    }

    /** La imagen está mal formada y no se le pudieron quitar los datos escondidos: no se sube. */
    @ExceptionHandler(NoSePudoLimpiarException.class)
    ProblemDetail onNoSePudoLimpiar(NoSePudoLimpiarException ex) {
        log.warn("Imagen que no se pudo procesar: {}", ex.getMessage());
        String detalle = "Esa imagen está dañada o incompleta y no se pudo procesar. Prueba a abrirla y "
                + "volver a guardarla, o sube otra.";
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detalle);
        pd.setTitle("Imagen ilegible");
        pd.setProperty("errors", Map.of("archivo", detalle));
        return pd;
    }

    /** Demasiadas fotos seguidas: el freno de la subida. */
    @ExceptionHandler(DemasiadasSubidasException.class)
    ProblemDetail onDemasiadasSubidas(DemasiadasSubidasException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
        pd.setTitle("Demasiadas subidas");
        pd.setProperty("errors", Map.of("archivo", ex.getMessage()));
        return pd;
    }

    /** Falta configurar el almacenamiento de fotos. */
    @ExceptionHandler(StorageNotConfiguredException.class)
    ProblemDetail onAlmacenSinConfigurar(StorageNotConfiguredException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
        pd.setTitle("Subida no disponible");
        pd.setProperty("errors", Map.of("archivo", ex.getMessage()));
        return pd;
    }

    /** El almacenamiento respondió mal o no respondió. */
    @ExceptionHandler(StorageFailedException.class)
    ProblemDetail onAlmacenFallo(StorageFailedException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY, ex.getMessage());
        pd.setTitle("No se pudo guardar la foto");
        pd.setProperty("errors", Map.of("archivo", ex.getMessage()));
        return pd;
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail onUnexpected(Exception ex) {
        // Se registra aquí a propósito: al capturarla, Spring ya no la escribe en el log,
        // y un fallo que nadie ve es un fallo que nadie arregla. Al cliente no le llega el detalle.
        log.error("Error no previsto atendiendo una petición", ex);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Algo salió mal. Inténtalo de nuevo.");
        pd.setTitle("Error interno");
        return pd;
    }
}

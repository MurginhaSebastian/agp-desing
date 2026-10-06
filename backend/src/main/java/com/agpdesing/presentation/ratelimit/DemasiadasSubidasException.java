package com.agpdesing.presentation.ratelimit;

/** Se han subido demasiadas fotos seguidas: lo frena `SubidaRateLimiter`. */
public class DemasiadasSubidasException extends RuntimeException {
    public DemasiadasSubidasException(String message) {
        super(message);
    }
}

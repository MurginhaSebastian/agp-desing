package com.agpdesing.domain.exception;

public class SaleNotFoundException extends DomainException {
    public SaleNotFoundException(String key) {
        super("No existe una venta con identificador " + key);
    }
}

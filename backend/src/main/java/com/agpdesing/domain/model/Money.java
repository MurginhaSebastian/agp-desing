package com.agpdesing.domain.model;

import com.agpdesing.domain.exception.DomainValidationException;

/** Dinero como entero en centavos. Nunca float. */
public record Money(long cents, Currency currency) {

    public enum Currency { COP, USD }

    public Money {
        if (cents <= 0) throw new DomainValidationException("priceCents", "El precio debe ser mayor que cero");
        if (currency == null) throw new DomainValidationException("currency", "La moneda es obligatoria");
    }
}

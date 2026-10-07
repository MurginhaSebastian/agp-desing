package com.agpdesing.domain.model;

import java.util.Objects;
import java.util.UUID;

/** Identidad de una venta. */
public record SaleId(UUID value) {
    public SaleId {
        Objects.requireNonNull(value, "id");
    }

    public static SaleId newId() {
        return new SaleId(UUID.randomUUID());
    }
}

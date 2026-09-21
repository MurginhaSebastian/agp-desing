package com.agpdesing.domain.model;

import java.util.Objects;
import java.util.UUID;

/** Identidad del cuadro. Envuelve el UUID para no pasar UUIDs sueltos por los casos de uso. */
public record ProductId(UUID value) {
    public ProductId {
        Objects.requireNonNull(value, "id");
    }

    public static ProductId newId() {
        return new ProductId(UUID.randomUUID());
    }

    public static ProductId of(String raw) {
        return new ProductId(UUID.fromString(raw));
    }
}

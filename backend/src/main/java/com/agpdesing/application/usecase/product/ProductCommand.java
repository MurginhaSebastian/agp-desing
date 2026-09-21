package com.agpdesing.application.usecase.product;

import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.ProductStatus;

/** Entrada de crear/actualizar. Sin anotaciones: es un DTO del núcleo, no de la web. */
public record ProductCommand(
        String name,
        String description,
        long priceCents,
        Money.Currency currency,
        int widthCm,
        int heightCm,
        String technique,
        String imageUrl,
        ProductStatus status,
        boolean featured
) {
    public Money price() {
        return new Money(priceCents, currency);
    }
}

package com.agpdesing.presentation.dto.request;

import com.agpdesing.application.usecase.product.ProductCommand;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.ProductStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * Cuerpo de POST/PUT /api/products. Primera línea de defensa (@Valid);
 * el dominio repite las mismas reglas por si alguien llama al caso de uso por otro camino.
 */
public record ProductRequest(
        @NotBlank @Size(min = 2, max = 120) String name,
        @Size(max = 2000) String description,
        @Positive long priceCents,
        @NotNull Money.Currency currency,
        @Positive @Max(1000) int widthCm,
        @Positive @Max(1000) int heightCm,
        @NotBlank @Size(max = 80) String technique,
        @NotBlank @Size(max = 500) @Pattern(regexp = "^(https?://|/).+", message = "Debe ser una URL http(s) o una ruta que empiece por /") String imageUrl,
        @NotNull ProductStatus status,
        boolean featured
) {
    public ProductCommand toCommand() {
        return new ProductCommand(name, description == null ? "" : description, priceCents, currency,
                widthCm, heightCm, technique, imageUrl, status, featured);
    }
}

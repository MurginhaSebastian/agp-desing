package com.agpdesing.presentation.dto.request;

import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
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
        @NotBlank @Size(min = 2, max = Product.NAME_MAX) String name,
        @Size(max = Product.DESCRIPTION_MAX) String description,
        @Positive long priceCents,
        @NotNull Money.Currency currency,
        @Positive @Max(Product.DIMENSION_MAX) int widthCm,
        @Positive @Max(Product.DIMENSION_MAX) int heightCm,
        @NotBlank @Size(max = Product.TECHNIQUE_MAX) String technique,
        @NotBlank @Size(max = Product.IMAGE_URL_MAX) @Pattern(regexp = "^(https?://|/).+", message = "Debe ser una URL http(s) o una ruta que empiece por /") String imageUrl,
        @NotNull ProductStatus status,
        boolean featured
) {}

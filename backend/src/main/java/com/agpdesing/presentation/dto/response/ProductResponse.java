package com.agpdesing.presentation.dto.response;

import java.time.Instant;

/** Espejo exacto de la interfaz Product del frontend (src/types/product.ts). */
public record ProductResponse(
        String id,
        String name,
        String slug,
        String description,
        long priceCents,
        String currency,
        int widthCm,
        int heightCm,
        String technique,
        String imageUrl,
        String status,
        boolean featured,
        Instant createdAt,
        Instant updatedAt
) {}

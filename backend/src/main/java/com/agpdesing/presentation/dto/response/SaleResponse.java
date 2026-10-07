package com.agpdesing.presentation.dto.response;

import java.time.Instant;
import java.time.LocalDate;

/** Espejo exacto de la interfaz Sale del frontend (src/types/sale.ts). Solo sale con sesión. */
public record SaleResponse(
        String id,
        String productId,
        String item,
        String detail,
        int quantity,
        long totalCents,
        long advanceCents,
        long balanceCents,
        String paymentMethod,
        String status,
        String customerName,
        String customerPhone,
        LocalDate saleDate,
        LocalDate deliveryDate,
        Instant createdAt,
        Instant updatedAt
) {}

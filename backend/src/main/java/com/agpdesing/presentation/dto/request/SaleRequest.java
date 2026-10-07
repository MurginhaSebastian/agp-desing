package com.agpdesing.presentation.dto.request;

import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Cuerpo de POST/PUT /api/sales. Primera línea de defensa; el dominio (`Sale`) repite las reglas.
 * `item` puede faltar si hay `productId`: entonces se copia el nombre de la obra.
 */
public record SaleRequest(
        UUID productId,
        @Size(max = Sale.ITEM_MAX) String item,
        @Size(max = Sale.DETAIL_MAX) String detail,
        @Min(1) @Max(Sale.QUANTITY_MAX) int quantity,
        @Positive long totalCents,
        @PositiveOrZero long advanceCents,
        @NotNull PaymentMethod paymentMethod,
        @NotNull SaleStatus status,
        @NotBlank @Size(max = Sale.CUSTOMER_NAME_MAX) String customerName,
        // Con espacios, guiones o el «+51» delante puede pasar de 15; el dominio cuenta solo los dígitos.
        @NotBlank @Size(max = 25) String customerPhone,
        @NotNull LocalDate saleDate,
        LocalDate deliveryDate,
        boolean markProductSold
) {}

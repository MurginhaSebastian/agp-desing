package com.agpdesing.application.usecase.sale;

import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.SaleStatus;

import java.time.LocalDate;

/**
 * Entrada de registrar o editar una venta. Sin anotaciones: es del núcleo, no de la web.
 *
 * @param productId     la obra del catálogo, o null si es un encargo a medida
 * @param item          qué se vendió; con obra se ignora y se copia su nombre
 * @param markProductSold si la obra pasa a «Vendido» en el catálogo al guardar
 */
public record SaleCommand(
        ProductId productId,
        String item,
        String detail,
        int quantity,
        long totalCents,
        long advanceCents,
        PaymentMethod paymentMethod,
        SaleStatus status,
        String customerName,
        String customerPhone,
        LocalDate saleDate,
        LocalDate deliveryDate,
        boolean markProductSold
) {}

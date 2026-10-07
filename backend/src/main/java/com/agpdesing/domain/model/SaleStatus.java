package com.agpdesing.domain.model;

/** En qué punto está una venta. Una cancelada no cuenta en los totales. */
public enum SaleStatus {
    PENDING, IN_PRODUCTION, DELIVERED, CANCELLED
}

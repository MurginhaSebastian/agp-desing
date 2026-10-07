package com.agpdesing.infrastructure.persistence.mapper;

import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleId;
import com.agpdesing.domain.model.SaleStatus;
import com.agpdesing.infrastructure.persistence.entity.SaleJpaEntity;
import org.springframework.stereotype.Component;

/** Traduce dominio <-> entidad JPA de las ventas. */
@Component
public class SalePersistenceMapper {

    public SaleJpaEntity toEntity(Sale s) {
        return new SaleJpaEntity(
                s.id().value(), s.productId().map(ProductId::value).orElse(null), s.item(), s.detail(), s.quantity(),
                s.totalCents(), s.advanceCents(), s.paymentMethod().name(), s.status().name(), s.customerName(),
                s.customerPhone(), s.saleDate(), s.deliveryDate().orElse(null), s.createdAt(), s.updatedAt());
    }

    public Sale toDomain(SaleJpaEntity e) {
        return Sale.rehydrate(new SaleId(e.getId()), new Sale.Datos(
                e.getProductId() == null ? null : new ProductId(e.getProductId()), e.getItem(), e.getDetail(),
                e.getQuantity(), e.getTotalCents(), e.getAdvanceCents(), PaymentMethod.valueOf(e.getPaymentMethod()),
                SaleStatus.valueOf(e.getStatus()), e.getCustomerName(), e.getCustomerPhone(), e.getSaleDate(),
                e.getDeliveryDate()), e.getCreatedAt(), e.getUpdatedAt());
    }
}

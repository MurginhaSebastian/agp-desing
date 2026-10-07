package com.agpdesing.presentation.mapper;

import com.agpdesing.application.usecase.sale.SaleCommand;
import com.agpdesing.application.usecase.sale.SalesSummaryUseCase;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.presentation.dto.request.SaleRequest;
import com.agpdesing.presentation.dto.response.SaleResponse;
import com.agpdesing.presentation.dto.response.SalesSummaryResponse;
import org.springframework.stereotype.Component;

/** Traduce JSON <-> núcleo para /api/sales. */
@Component
public class SaleDtoMapper {

    public SaleCommand toCommand(SaleRequest r) {
        return new SaleCommand(r.productId() == null ? null : new ProductId(r.productId()), r.item(), r.detail(),
                r.quantity(), r.totalCents(), r.advanceCents(), r.paymentMethod(), r.status(), r.customerName(),
                r.customerPhone(), r.saleDate(), r.deliveryDate(), r.markProductSold());
    }

    public SaleResponse toResponse(Sale s) {
        return new SaleResponse(s.id().value().toString(), s.productId().map((p) -> p.value().toString()).orElse(null),
                s.item(), s.detail(), s.quantity(), s.totalCents(), s.advanceCents(), s.balanceCents(),
                s.paymentMethod().name(), s.status().name(), s.customerName(), s.customerPhone(), s.saleDate(),
                s.deliveryDate().orElse(null), s.createdAt(), s.updatedAt());
    }

    public SalesSummaryResponse toResponse(SalesSummaryUseCase.Summary s) {
        return new SalesSummaryResponse(s.month().toString(), s.totalCents(), s.previousMonthTotalCents(),
                s.pendingCents(), s.salesCount(), s.topItems().stream()
                .map((t) -> new SalesSummaryResponse.TopItem(t.productId().map((p) -> p.value().toString()).orElse(null),
                        t.item(), t.quantity(), t.totalCents()))
                .toList());
    }
}

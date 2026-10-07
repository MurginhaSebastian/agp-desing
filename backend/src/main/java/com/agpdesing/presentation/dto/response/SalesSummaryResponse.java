package com.agpdesing.presentation.dto.response;

import java.util.List;

/** Espejo de SalesSummary en src/types/sale.ts. `month` va como "2026-10". */
public record SalesSummaryResponse(
        String month,
        long totalCents,
        long previousMonthTotalCents,
        long pendingCents,
        int salesCount,
        List<TopItem> topItems
) {
    public record TopItem(String productId, String item, int quantity, long totalCents) {}
}

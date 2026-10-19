package com.agpdesing.presentation.mapper;

import com.agpdesing.application.port.out.TokenProvider;
import com.agpdesing.application.usecase.product.ProductCommand;
import com.agpdesing.application.usecase.sale.SaleCommand;
import com.agpdesing.application.usecase.sale.SalesSummaryUseCase;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleStatus;
import com.agpdesing.domain.model.SiteSettings;
import com.agpdesing.presentation.dto.request.ProductRequest;
import com.agpdesing.presentation.dto.request.SaleRequest;
import com.agpdesing.presentation.dto.response.AuthResponse;
import com.agpdesing.presentation.dto.response.ProductResponse;
import com.agpdesing.presentation.dto.response.SaleResponse;
import com.agpdesing.presentation.dto.response.SalesSummaryResponse;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DtoMappersTest {

    private static final Instant T = Instant.parse("2026-03-04T05:06:07Z");

    // --- productos ---

    @Test
    void productoPasaDeJsonAComandoYDescripcionNulaQuedaVacia() {
        var r = new ProductRequest("Seda I", null, 12_000, Money.Currency.PEN, 30, 40, "Óleo", "/a.jpg",
                ProductStatus.AVAILABLE, true);
        ProductCommand c = new ProductDtoMapper().toCommand(r);
        assertEquals("", c.description());
        assertEquals(new Money(12_000, Money.Currency.PEN), c.price());
        assertEquals(30, c.widthCm());
        assertEquals(true, c.featured());
    }

    @Test
    void productoSeMuestraComoTextoPlanoParaElFront() {
        Product p = Product.create("Seda I", "desc", new Money(12_000, Money.Currency.USD), 30, 40, "Óleo",
                "/a.jpg", ProductStatus.COMMISSION, true, T);
        ProductResponse r = new ProductDtoMapper().toResponse(p);
        assertEquals(p.id().value().toString(), r.id());
        assertEquals("seda-i", r.slug());
        assertEquals(12_000, r.priceCents());
        assertEquals("USD", r.currency());
        assertEquals("COMMISSION", r.status());
        assertEquals(T, r.createdAt());
        assertEquals(T, r.updatedAt());
    }

    // --- ventas ---

    @Test
    void ventaSinObraTraduceElProductIdANulo() {
        var r = new SaleRequest(null, "Box", "d", 2, 1000, 100, PaymentMethod.YAPE, SaleStatus.PENDING, "Ana",
                "987654321", LocalDate.of(2026, 3, 1), null, true);
        SaleCommand c = new SaleDtoMapper().toCommand(r);
        assertNull(c.productId());
        assertEquals(true, c.markProductSold());
        assertEquals(2, c.quantity());
    }

    @Test
    void ventaConObraEnvuelveElUuid() {
        UUID u = UUID.randomUUID();
        var r = new SaleRequest(u, null, null, 1, 1000, 0, PaymentMethod.CASH_ON_DELIVERY, SaleStatus.DELIVERED,
                "Ana", "987654321", LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 2), false);
        assertEquals(new ProductId(u), new SaleDtoMapper().toCommand(r).productId());
    }

    @Test
    void ventaSeMuestraConSaldoYOpcionalesVaciosComoNulo() {
        Sale s = Sale.create(new Sale.Datos(null, "Box", "", 1, 15_000, 5_000, PaymentMethod.TRANSFER,
                SaleStatus.IN_PRODUCTION, "Ana", "987654321", LocalDate.of(2026, 3, 1), null), T);
        SaleResponse r = new SaleDtoMapper().toResponse(s);
        assertNull(r.productId());
        assertNull(r.deliveryDate());
        assertEquals(10_000, r.balanceCents());
        assertEquals("TRANSFER", r.paymentMethod());
        assertEquals("IN_PRODUCTION", r.status());
    }

    @Test
    void ventaConObraYEntregaLlevaAmbas() {
        ProductId pid = ProductId.newId();
        Sale s = Sale.create(new Sale.Datos(pid, "Seda", "", 1, 100, 0, PaymentMethod.YAPE, SaleStatus.PENDING,
                "Ana", "987654321", LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 9)), T);
        SaleResponse r = new SaleDtoMapper().toResponse(s);
        assertEquals(pid.value().toString(), r.productId());
        assertEquals(LocalDate.of(2026, 3, 9), r.deliveryDate());
    }

    @Test
    void resumenMensualFormateaElMesYLosMasVendidos() {
        ProductId pid = ProductId.newId();
        var resumen = new SalesSummaryUseCase.Summary(YearMonth.of(2026, 10), 900, 400, 150, 3, List.of(
                new SalesSummaryUseCase.TopItem(Optional.of(pid), "Seda", 2, 600),
                new SalesSummaryUseCase.TopItem(Optional.empty(), "Encargo", 1, 300)));
        SalesSummaryResponse r = new SaleDtoMapper().toResponse(resumen);
        assertEquals("2026-10", r.month());
        assertEquals(900, r.totalCents());
        assertEquals(400, r.previousMonthTotalCents());
        assertEquals(150, r.pendingCents());
        assertEquals(3, r.salesCount());
        assertEquals(2, r.topItems().size());
        assertEquals(pid.value().toString(), r.topItems().get(0).productId());
        assertNull(r.topItems().get(1).productId());
        assertEquals("Encargo", r.topItems().get(1).item());
    }

    // --- ajustes y auth ---

    @Test
    void ajustesSeMuestranConSuImagen() {
        assertEquals("/p.jpg", new SettingsDtoMapper().toResponse(new SiteSettings("/p.jpg")).heroImageUrl());
        assertEquals("", new SettingsDtoMapper().toResponse(SiteSettings.empty()).heroImageUrl());
    }

    @Test
    void authCopiaTokenCaducidadYUsuario() {
        AuthResponse r = new AuthDtoMapper().toResponse(new TokenProvider.IssuedToken("jwt.x.y", T), "admin");
        assertEquals("jwt.x.y", r.token());
        assertEquals(T, r.expiresAt());
        assertEquals("admin", r.username());
    }
}

package com.agpdesing.application;

import com.agpdesing.application.usecase.sale.QuerySalesUseCase;
import com.agpdesing.application.usecase.sale.SaleCommand;
import com.agpdesing.application.usecase.sale.SalesSummaryUseCase;
import com.agpdesing.application.usecase.sale.SaveSaleUseCase;
import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleStatus;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Ramas de {@link SaveSaleUseCase}, {@link QuerySalesUseCase} y {@link SalesSummaryUseCase} que el test base no toca. */
class SalesUseCasesCasosLimiteTest {

    private static final Instant T0 = Instant.parse("2026-10-07T15:00:00Z");

    private final CreateProductUseCaseTest.InMemoryProducts productos = new CreateProductUseCaseTest.InMemoryProducts();
    private final SalesUseCasesTest.Ventas ventas = new SalesUseCasesTest.Ventas();
    private final TransaccionesDePrueba tx = new TransaccionesDePrueba();
    private final ProductUseCasesTest.MutableClock clock = new ProductUseCasesTest.MutableClock(T0);
    private final SaveSaleUseCase guardar = new SaveSaleUseCase(ventas, productos, clock, tx);
    private final QuerySalesUseCase consultar = new QuerySalesUseCase(ventas, tx);
    private final SalesSummaryUseCase resumen = new SalesSummaryUseCase(ventas);

    private Product obra(String nombre, ProductStatus estado) {
        return productos.save(Product.create(nombre, "", new Money(9_500, Money.Currency.PEN), 30, 40, "Cuadro 3D",
                "/a.jpg", estado, false, Instant.EPOCH));
    }

    private static SaleCommand cmd(ProductId obra, String item, long total, SaleStatus estado, LocalDate fecha,
                                   int cantidad, boolean marcar) {
        return new SaleCommand(obra, item, "", cantidad, total, 0, PaymentMethod.YAPE, estado, "Ana Torres",
                "987654321", fecha, null, marcar);
    }

    private SaleCommand enc(String item, long total, LocalDate fecha, int cantidad) {
        return cmd(null, item, total, SaleStatus.PENDING, fecha, cantidad, false);
    }

    @Test
    void editingToAnotherWorkTakesTheNewWorksName() {
        Product a = obra("Seda I", ProductStatus.AVAILABLE);
        Product b = obra("Bruma", ProductStatus.AVAILABLE);
        Sale s = guardar.create(cmd(a.id(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, false));

        Sale editada = guardar.update(s.id(), cmd(b.id(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, false));

        assertEquals("Bruma", editada.item());
        assertEquals(b.id(), editada.productId().orElseThrow());
    }

    @Test
    void editingFromAWorkToACustomOrderUsesTheTypedItemAndDropsTheWork() {
        Product a = obra("Seda I", ProductStatus.AVAILABLE);
        Sale s = guardar.create(cmd(a.id(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, false));

        Sale editada = guardar.update(s.id(), enc("Cuadro a medida", 9_500, LocalDate.of(2026, 10, 7), 1));

        assertEquals("Cuadro a medida", editada.item());
        assertTrue(editada.productId().isEmpty());
    }

    @Test
    void editingToAMissingWorkIsNotFoundAndLeavesTheSaleAsItWas() {
        Sale s = guardar.create(enc("Encargo", 9_500, LocalDate.of(2026, 10, 7), 1));

        assertThrows(ProductNotFoundException.class,
                () -> guardar.update(s.id(), cmd(ProductId.newId(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, true)));

        assertEquals("Encargo", consultar.byId(s.id()).item());
    }

    @Test
    void editingWithTheCheckboxMarksTheWorkSold() {
        Product a = obra("Seda I", ProductStatus.AVAILABLE);
        Sale s = guardar.create(cmd(a.id(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, false));
        guardar.update(s.id(), cmd(a.id(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, true));
        assertEquals(ProductStatus.SOLD, productos.findById(a.id()).orElseThrow().status());
    }

    @Test
    void anAlreadySoldWorkIsNotSavedAgain() {
        Product vendida = obra("Seda I", ProductStatus.SOLD);
        clock.now = Instant.parse("2026-10-20T00:00:00Z");

        guardar.create(cmd(vendida.id(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, true));

        assertEquals(Instant.EPOCH, productos.findById(vendida.id()).orElseThrow().updatedAt(),
                "no se toca una obra que ya estaba vendida");
    }

    @Test
    void aFailedEditDoesNotMarkTheWorkSold() {
        Product a = obra("Seda I", ProductStatus.AVAILABLE);
        Sale s = guardar.create(cmd(a.id(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, false));
        SaleCommand malo = cmd(a.id(), null, 9_500, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 100, true); // cantidad > 99

        DomainValidationException e = assertThrows(DomainValidationException.class, () -> guardar.update(s.id(), malo));

        assertEquals("quantity", e.field());
        assertEquals(ProductStatus.AVAILABLE, productos.findById(a.id()).orElseThrow().status());
    }

    @Test
    void invalidSaleReportsTheFieldAndIsNotStored() {
        SaleCommand sinNombre = new SaleCommand(null, "Encargo", "", 1, 100, 0, PaymentMethod.YAPE, SaleStatus.PENDING,
                " ", "987654321", LocalDate.of(2026, 10, 7), null, false);
        assertEquals("customerName",
                assertThrows(DomainValidationException.class, () -> guardar.create(sinNombre)).field());
        assertTrue(ventas.store.isEmpty());
    }

    @Test
    void sameDaySalesComeLastRegisteredFirst() {
        LocalDate dia = LocalDate.of(2026, 10, 5);
        guardar.create(enc("Primera", 100, dia, 1));
        clock.now = T0.plusSeconds(60);
        guardar.create(enc("Segunda", 100, dia, 1));
        clock.now = T0.plusSeconds(120);
        guardar.create(enc("Tercera", 100, dia, 1));

        assertEquals(List.of("Tercera", "Segunda", "Primera"),
                consultar.between(dia, dia).stream().map(Sale::item).toList());
    }

    @Test
    void rangeIsInclusiveOnBothEnds() {
        guardar.create(enc("Primer dia", 100, LocalDate.of(2026, 10, 1), 1));
        guardar.create(enc("Ultimo dia", 100, LocalDate.of(2026, 10, 31), 1));
        guardar.create(enc("Antes", 100, LocalDate.of(2026, 9, 30), 1));
        guardar.create(enc("Despues", 100, LocalDate.of(2026, 11, 1), 1));

        assertEquals(List.of("Ultimo dia", "Primer dia"),
                consultar.between(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31)).stream().map(Sale::item).toList());
    }

    @Test
    void emptyMonthIsAllZeros() {
        SalesSummaryUseCase.Summary r = resumen.of(YearMonth.of(2026, 10));
        assertEquals(0, r.totalCents());
        assertEquals(0, r.previousMonthTotalCents());
        assertEquals(0, r.pendingCents());
        assertEquals(0, r.salesCount());
        assertTrue(r.topItems().isEmpty());
    }

    @Test
    void januaryComparesAgainstDecemberOfThePreviousYear() {
        guardar.create(enc("Navidad", 8_000, LocalDate.of(2025, 12, 31), 1));
        guardar.create(enc("Octubre", 5_000, LocalDate.of(2025, 10, 31), 1));
        guardar.create(enc("Enero", 3_000, LocalDate.of(2026, 1, 1), 1));

        SalesSummaryUseCase.Summary r = resumen.of(YearMonth.of(2026, 1));

        assertEquals(3_000, r.totalCents());
        assertEquals(8_000, r.previousMonthTotalCents());
    }

    @Test
    void cancelledSalesCountNowhereNotEvenInThePreviousMonth() {
        guardar.create(cmd(null, "Cancelada vieja", 9_000, SaleStatus.CANCELLED, LocalDate.of(2026, 9, 15), 1, false));
        guardar.create(cmd(null, "Cancelada nueva", 9_000, SaleStatus.CANCELLED, LocalDate.of(2026, 10, 15), 1, false));

        SalesSummaryUseCase.Summary r = resumen.of(YearMonth.of(2026, 10));

        assertEquals(0, r.previousMonthTotalCents());
        assertEquals(0, r.totalCents());
        assertEquals(0, r.pendingCents());
        assertEquals(0, r.salesCount());
    }

    @Test
    void salesOnTheFirstAndLastDayBelongToTheirMonth() {
        guardar.create(enc("Uno", 100, LocalDate.of(2026, 10, 1), 1));
        guardar.create(enc("Treinta y uno", 200, LocalDate.of(2026, 10, 31), 1));
        guardar.create(enc("Noviembre", 400, LocalDate.of(2026, 11, 1), 1));

        SalesSummaryUseCase.Summary r = resumen.of(YearMonth.of(2026, 10));

        assertEquals(300, r.totalCents());
        assertEquals(2, r.salesCount());
    }

    @Test
    void topItemsAreCappedAtFiveOrderedByQuantityThenTotal() {
        LocalDate d = LocalDate.of(2026, 10, 3);
        guardar.create(enc("Obra A", 100, d, 1));
        guardar.create(enc("Obra B", 300, d, 1));   // misma cantidad que A y C, más total
        guardar.create(enc("Obra C", 200, d, 1));
        guardar.create(enc("Obra D", 100, d, 1));
        guardar.create(enc("Obra E", 100, d, 1));
        guardar.create(enc("Obra F", 100, d, 1));
        guardar.create(enc("Obra G", 100, d, 5));   // la que más se vendió

        List<String> top = resumen.of(YearMonth.of(2026, 10)).topItems().stream()
                .map(SalesSummaryUseCase.TopItem::item).toList();

        assertEquals(5, top.size());
        assertEquals(List.of("Obra G", "Obra B", "Obra C"), top.subList(0, 3));
    }

    @Test
    void customOrdersWithTheSameNameAcrossCaseGroupWithSummedTotals() {
        LocalDate d = LocalDate.of(2026, 10, 3);
        guardar.create(enc("Box Aniversario", 1_000, d, 1));
        guardar.create(enc("BOX aniversario", 2_500, d, 3));

        List<SalesSummaryUseCase.TopItem> top = resumen.of(YearMonth.of(2026, 10)).topItems();

        assertEquals(1, top.size());
        assertEquals(4, top.get(0).quantity());
        assertEquals(3_500, top.get(0).totalCents());
    }

    @Test
    void pendingCountsTheBalanceOfEveryNonCancelledSaleIncludingDelivered() {
        guardar.create(new SaleCommand(null, "Entregada con saldo", "", 1, 10_000, 2_500, PaymentMethod.YAPE,
                SaleStatus.DELIVERED, "Ana Torres", "987654321", LocalDate.of(2026, 10, 3), null, false));
        guardar.create(new SaleCommand(null, "Pagada", "", 1, 4_000, 4_000, PaymentMethod.YAPE,
                SaleStatus.PENDING, "Ana Torres", "987654321", LocalDate.of(2026, 10, 3), null, false));

        assertEquals(7_500, resumen.of(YearMonth.of(2026, 10)).pendingCents());
    }
}

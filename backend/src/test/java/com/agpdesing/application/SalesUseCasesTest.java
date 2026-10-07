package com.agpdesing.application;

import com.agpdesing.application.usecase.sale.QuerySalesUseCase;
import com.agpdesing.application.usecase.sale.SaleCommand;
import com.agpdesing.application.usecase.sale.SalesSummaryUseCase;
import com.agpdesing.application.usecase.sale.SaveSaleUseCase;
import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.exception.SaleNotFoundException;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleId;
import com.agpdesing.domain.model.SaleStatus;
import com.agpdesing.domain.repository.SaleRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SalesUseCasesTest {

    private final CreateProductUseCaseTest.InMemoryProducts productos = new CreateProductUseCaseTest.InMemoryProducts();
    private final Ventas ventas = new Ventas();
    private final TransaccionesDePrueba tx = new TransaccionesDePrueba();
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-07T15:00:00Z"), ZoneOffset.UTC);
    private final SaveSaleUseCase guardar = new SaveSaleUseCase(ventas, productos, clock, tx);
    private final QuerySalesUseCase consultar = new QuerySalesUseCase(ventas, tx);
    private final SalesSummaryUseCase resumen = new SalesSummaryUseCase(ventas);

    private Product obra(String nombre) {
        return productos.save(Product.create(nombre, "", new Money(9_500, Money.Currency.PEN), 30, 40, "Cuadro 3D",
                "/a.jpg", ProductStatus.AVAILABLE, false, Instant.EPOCH));
    }

    private static SaleCommand cmd(ProductId obra, String item, long total, long adelanto, SaleStatus estado,
                                   LocalDate fecha, int cantidad, boolean marcar) {
        return new SaleCommand(obra, item, "", cantidad, total, adelanto, PaymentMethod.YAPE, estado, "Ana Torres",
                "987654321", fecha, null, marcar);
    }

    private static SaleCommand cmd(ProductId obra, String item, boolean marcar) {
        return cmd(obra, item, 9_500, 0, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, marcar);
    }

    @Test
    void ventaDeUnaObraCopiaSuNombreYLaMarcaVendidaSiSePide() {
        Product p = obra("Seda I");
        Sale s = guardar.create(cmd(p.id(), "lo que escriba el formulario", true));
        assertEquals("Seda I", s.item(), "con obra, el nombre sale de la obra");
        assertEquals(ProductStatus.SOLD, productos.findById(p.id()).orElseThrow().status());
        assertEquals(1, tx.abiertas, "venta y obra en una sola transacción");
    }

    @Test
    void sinLaCasillaLaObraSigueComoEstaba() {
        Product p = obra("Seda I");
        guardar.create(cmd(p.id(), null, false));
        assertEquals(ProductStatus.AVAILABLE, productos.findById(p.id()).orElseThrow().status());
    }

    @Test
    void encargoAMedidaSinObra() {
        Sale s = guardar.create(cmd(null, "Cuadro de la promoción 2010", false));
        assertEquals("Cuadro de la promoción 2010", s.item());
        assertTrue(s.productId().isEmpty());
    }

    @Test
    void obraInexistente() {
        assertThrows(ProductNotFoundException.class, () -> guardar.create(cmd(ProductId.newId(), null, true)));
        assertTrue(ventas.store.isEmpty());
    }

    @Test
    void siLaVentaNoValeLaObraNoSeToca() {
        Product p = obra("Seda I");
        SaleCommand malo = cmd(p.id(), null, 100, 200, SaleStatus.PENDING, LocalDate.of(2026, 10, 7), 1, true);
        assertThrows(DomainValidationException.class, () -> guardar.create(malo));
        assertEquals(ProductStatus.AVAILABLE, productos.findById(p.id()).orElseThrow().status());
    }

    @Test
    void alEditarConservaElNombreConElQueSeVendio() {
        Product p = obra("Seda I");
        Sale s = guardar.create(cmd(p.id(), null, false));
        p.update("Seda Primera", "", p.price(), 30, 40, "Cuadro 3D", "/a.jpg", ProductStatus.AVAILABLE, false, Instant.EPOCH);
        productos.save(p);
        Sale editada = guardar.update(s.id(), cmd(p.id(), null, 20_000, 0, SaleStatus.DELIVERED, LocalDate.of(2026, 10, 7), 1, false));
        assertEquals("Seda I", editada.item());
        assertEquals(SaleStatus.DELIVERED, editada.status());
        assertThrows(SaleNotFoundException.class, () -> guardar.update(SaleId.newId(), cmd(null, "x", false)));
    }

    @Test
    void listaLasMasRecientesPrimeroYBorra() {
        Sale vieja = guardar.create(cmd(null, "Vieja", 100, 0, SaleStatus.PENDING, LocalDate.of(2026, 10, 1), 1, false));
        Sale nueva = guardar.create(cmd(null, "Nueva", 100, 0, SaleStatus.PENDING, LocalDate.of(2026, 10, 5), 1, false));
        guardar.create(cmd(null, "De otro mes", 100, 0, SaleStatus.PENDING, LocalDate.of(2026, 9, 30), 1, false));
        assertEquals(List.of("Nueva", "Vieja"),
                consultar.between(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31)).stream().map(Sale::item).toList());
        consultar.delete(vieja.id());
        assertThrows(SaleNotFoundException.class, () -> consultar.byId(vieja.id()));
        assertEquals("Nueva", consultar.byId(nueva.id()).item());
        assertThrows(SaleNotFoundException.class, () -> consultar.delete(vieja.id()));
    }

    @Test
    void resumenDelMes() {
        Product seda = obra("Seda I");
        Product box = obra("Box aniversario");
        LocalDate oct = LocalDate.of(2026, 10, 3);
        guardar.create(cmd(seda.id(), null, 10_000, 4_000, SaleStatus.PENDING, oct, 2, false));
        guardar.create(cmd(seda.id(), null, 5_000, 5_000, SaleStatus.DELIVERED, oct, 1, false));
        guardar.create(cmd(box.id(), null, 20_000, 0, SaleStatus.IN_PRODUCTION, oct, 1, false));
        guardar.create(cmd(null, "Encargo a medida", 30_000, 10_000, SaleStatus.PENDING, oct, 1, false));
        guardar.create(cmd(null, "Cancelada", 99_000, 0, SaleStatus.CANCELLED, oct, 9, false));
        guardar.create(cmd(null, "Septiembre", 7_000, 7_000, SaleStatus.DELIVERED, LocalDate.of(2026, 9, 20), 1, false));

        SalesSummaryUseCase.Summary r = resumen.of(YearMonth.of(2026, 10));
        assertEquals(65_000, r.totalCents(), "las canceladas no cuentan");
        assertEquals(7_000, r.previousMonthTotalCents());
        assertEquals(6_000 + 20_000 + 20_000, r.pendingCents());
        assertEquals(4, r.salesCount());
        assertEquals("Seda I", r.topItems().get(0).item());
        assertEquals(3, r.topItems().get(0).quantity(), "2 + 1 de la misma obra");
        assertFalse(r.topItems().stream().anyMatch((t) -> t.item().equals("Cancelada")));
    }

    @Test
    void lasVentasDeUnaObraBorradaSiguenJuntasPorSuNombre() {
        LocalDate oct = LocalDate.of(2026, 10, 3);
        // Así quedan tras borrar la obra: sin productId, con el nombre con el que se vendió.
        guardar.create(cmd(null, "Seda I", 100, 0, SaleStatus.PENDING, oct, 1, false));
        guardar.create(cmd(null, "seda i", 100, 0, SaleStatus.PENDING, oct, 2, false));
        assertEquals(3, resumen.of(YearMonth.of(2026, 10)).topItems().get(0).quantity());
    }

    /** Ventas en memoria. */
    static final class Ventas implements SaleRepository {
        final Map<SaleId, Sale> store = new HashMap<>();

        @Override public Sale save(Sale s) { store.put(s.id(), s); return s; }
        @Override public Optional<Sale> findById(SaleId id) { return Optional.ofNullable(store.get(id)); }
        @Override public List<Sale> findBetween(LocalDate desde, LocalDate hasta) {
            return new ArrayList<>(store.values().stream()
                    .filter((s) -> !s.saleDate().isBefore(desde) && !s.saleDate().isAfter(hasta)).toList());
        }
        @Override public void deleteById(SaleId id) { store.remove(id); }
    }
}

package com.agpdesing.domain;

import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Instant;
import java.time.LocalDate;

import com.agpdesing.domain.model.SaleId;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SaleTest {

    static Sale.Datos datos() {
        return new Sale.Datos(null, "Box aniversario", "  Fotos de la boda, 12/03  ", 1, 15_000, 5_000,
                PaymentMethod.YAPE, SaleStatus.PENDING, " Ana Torres ", "+51 987 654 321",
                LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 14));
    }

    private static String campoQueFalla(Sale.Datos d) {
        return assertThrows(DomainValidationException.class, () -> Sale.create(d, Instant.EPOCH)).field();
    }

    private static Sale.Datos con(String item, String detail, int cantidad, String nombre, String tel) {
        Sale.Datos d = datos();
        return new Sale.Datos(d.productId(), item, detail, cantidad, d.totalCents(), d.advanceCents(), d.paymentMethod(),
                d.status(), nombre, tel, d.saleDate(), d.deliveryDate());
    }

    @Test
    void limpiaLoEscritoYCalculaElSaldo() {
        Sale s = Sale.create(datos(), Instant.EPOCH);
        assertEquals("Ana Torres", s.customerName());
        assertEquals("51987654321", s.customerPhone(), "solo los dígitos");
        assertEquals("Fotos de la boda, 12/03", s.detail());
        assertEquals(10_000, s.balanceCents());
    }

    @Test
    void elAdelantoNoPuedePasarDelTotal() {
        Sale.Datos d = datos();
        assertEquals("advanceCents", campoQueFalla(new Sale.Datos(d.productId(), d.item(), d.detail(), d.quantity(), 100, 101,
                d.paymentMethod(), d.status(), d.customerName(), d.customerPhone(), d.saleDate(), d.deliveryDate())));
        assertEquals("advanceCents", campoQueFalla(new Sale.Datos(d.productId(), d.item(), d.detail(), d.quantity(), 100, -1,
                d.paymentMethod(), d.status(), d.customerName(), d.customerPhone(), d.saleDate(), d.deliveryDate())));
    }

    @Test
    void pagadoDelTodoQuedaSinSaldo() {
        Sale.Datos d = datos();
        Sale s = Sale.create(new Sale.Datos(d.productId(), d.item(), d.detail(), d.quantity(), 100, 100,
                d.paymentMethod(), d.status(), d.customerName(), d.customerPhone(), d.saleDate(), d.deliveryDate()), Instant.EPOCH);
        assertEquals(0, s.balanceCents());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "12345678", "1234567890123456", "sin numero"})
    void telefonoRaro(String tel) {
        Sale.Datos d = datos();
        assertEquals("customerPhone", campoQueFalla(new Sale.Datos(d.productId(), d.item(), d.detail(), d.quantity(), d.totalCents(),
                d.advanceCents(), d.paymentMethod(), d.status(), d.customerName(), tel, d.saleDate(), d.deliveryDate())));
    }

    @Test
    void laEntregaNoPuedeSerAntesDeLaVenta() {
        Sale.Datos d = datos();
        assertEquals("deliveryDate", campoQueFalla(new Sale.Datos(d.productId(), d.item(), d.detail(), d.quantity(), d.totalCents(),
                d.advanceCents(), d.paymentMethod(), d.status(), d.customerName(), d.customerPhone(), d.saleDate(), d.saleDate().minusDays(1))));
    }

    @Test
    void camposObligatorios() {
        Sale.Datos d = datos();
        assertEquals("item", campoQueFalla(new Sale.Datos(null, " ", d.detail(), 1, 100, 0, d.paymentMethod(), d.status(),
                d.customerName(), d.customerPhone(), d.saleDate(), null)));
        assertEquals("quantity", campoQueFalla(new Sale.Datos(null, d.item(), d.detail(), 0, 100, 0, d.paymentMethod(), d.status(),
                d.customerName(), d.customerPhone(), d.saleDate(), null)));
        assertEquals("totalCents", campoQueFalla(new Sale.Datos(null, d.item(), d.detail(), 1, 0, 0, d.paymentMethod(), d.status(),
                d.customerName(), d.customerPhone(), d.saleDate(), null)));
        assertEquals("paymentMethod", campoQueFalla(new Sale.Datos(null, d.item(), d.detail(), 1, 100, 0, null, d.status(),
                d.customerName(), d.customerPhone(), d.saleDate(), null)));
        assertEquals("saleDate", campoQueFalla(new Sale.Datos(null, d.item(), d.detail(), 1, 100, 0, d.paymentMethod(), d.status(),
                d.customerName(), d.customerPhone(), null, null)));
        assertEquals("customerName", campoQueFalla(new Sale.Datos(null, d.item(), d.detail(), 1, 100, 0, d.paymentMethod(), d.status(),
                "A", d.customerPhone(), d.saleDate(), null)));
    }

    @Test
    void sinFechaDeEntregaVale() {
        Sale.Datos d = datos();
        Sale s = Sale.create(new Sale.Datos(null, d.item(), d.detail(), 1, 100, 0, d.paymentMethod(), d.status(),
                d.customerName(), d.customerPhone(), d.saleDate(), null), Instant.EPOCH);
        assertTrue(s.deliveryDate().isEmpty());
        assertTrue(s.productId().isEmpty());
    }

    @Test
    void itemEnElTopeVale() {
        assertEquals("a".repeat(Sale.ITEM_MAX), Sale.create(con("a".repeat(Sale.ITEM_MAX), "", 1, "Ana", "987654321"), Instant.EPOCH).item());
    }

    @Test
    void itemPorEncimaDelTopeSeRechaza() {
        assertEquals("item", campoQueFalla(con("a".repeat(Sale.ITEM_MAX + 1), "", 1, "Ana", "987654321")));
    }

    @Test
    void detalleEnElTopeVale() {
        assertEquals(Sale.DETAIL_MAX, Sale.create(con("Box", "a".repeat(Sale.DETAIL_MAX), 1, "Ana", "987654321"), Instant.EPOCH).detail().length());
    }

    @Test
    void detallePorEncimaDelTopeSeRechaza() {
        assertEquals("detail", campoQueFalla(con("Box", "a".repeat(Sale.DETAIL_MAX + 1), 1, "Ana", "987654321")));
    }

    @Test
    void detalleNuloQuedaVacio() {
        assertEquals("", Sale.create(con("Box", null, 1, "Ana", "987654321"), Instant.EPOCH).detail());
    }

    @Test
    void nombreDelClienteEnElTopeVale() {
        assertEquals(Sale.CUSTOMER_NAME_MAX, Sale.create(con("Box", "", 1, "a".repeat(Sale.CUSTOMER_NAME_MAX), "987654321"), Instant.EPOCH).customerName().length());
    }

    @Test
    void nombreDelClientePorEncimaDelTopeSeRechaza() {
        assertEquals("customerName", campoQueFalla(con("Box", "", 1, "a".repeat(Sale.CUSTOMER_NAME_MAX + 1), "987654321")));
    }

    @Test
    void cantidadEnLosExtremosVale() {
        assertEquals(1, Sale.create(con("Box", "", 1, "Ana", "987654321"), Instant.EPOCH).quantity());
        assertEquals(Sale.QUANTITY_MAX, Sale.create(con("Box", "", Sale.QUANTITY_MAX, "Ana", "987654321"), Instant.EPOCH).quantity());
    }

    @Test
    void cantidadPorEncimaDelTopeSeRechaza() {
        assertEquals("quantity", campoQueFalla(con("Box", "", Sale.QUANTITY_MAX + 1, "Ana", "987654321")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"123456789", "123456789012345", "+51 (987) 654-321"})
    void telefonoEnLosLimitesVale(String tel) {
        assertDoesNotThrow(() -> Sale.create(con("Box", "", 1, "Ana", tel), Instant.EPOCH));
    }

    @Test
    void updateReemplazaLosDatosYSoloMueveUpdatedAt() {
        Instant creada = Instant.parse("2026-10-07T10:00:00Z");
        Instant editada = creada.plusSeconds(3600);
        Sale s = Sale.create(datos(), creada);
        s.update(con("Cuadro nuevo", "", 2, "Luis", "999888777"), editada);
        assertEquals("Cuadro nuevo", s.item());
        assertEquals(2, s.quantity());
        assertEquals("Luis", s.customerName());
        assertEquals("999888777", s.customerPhone());
        assertEquals(creada, s.createdAt());
        assertEquals(editada, s.updatedAt());
    }

    @Test
    void updateInvalidoNoCambiaLaFechaDeEdicion() {
        Instant creada = Instant.parse("2026-10-07T10:00:00Z");
        Sale s = Sale.create(datos(), creada);
        var e = assertThrows(DomainValidationException.class, () -> s.update(con("Box", "", 0, "Ana", "987654321"), creada.plusSeconds(60)));
        assertEquals("quantity", e.field());
        assertEquals(creada, s.updatedAt());
    }

    @Test
    void rehydrateConservaIdYFechas() {
        SaleId id = new SaleId(UUID.randomUUID());
        Instant creada = Instant.parse("2026-01-01T00:00:00Z");
        Instant editada = Instant.parse("2026-02-01T00:00:00Z");
        Sale s = Sale.rehydrate(id, datos(), creada, editada);
        assertEquals(id, s.id());
        assertEquals(creada, s.createdAt());
        assertEquals(editada, s.updatedAt());
    }

    @Test
    void rehydrateTambienValidaLosDatos() {
        assertThrows(DomainValidationException.class,
                () -> Sale.rehydrate(SaleId.newId(), con("Box", "", 0, "Ana", "987654321"), Instant.EPOCH, Instant.EPOCH));
    }

    @Test
    void soloEstaAnuladaConEstadoCancelled() {
        Sale.Datos d = datos();
        Sale anulada = Sale.create(new Sale.Datos(d.productId(), d.item(), d.detail(), d.quantity(), d.totalCents(), d.advanceCents(),
                d.paymentMethod(), SaleStatus.CANCELLED, d.customerName(), d.customerPhone(), d.saleDate(), d.deliveryDate()), Instant.EPOCH);
        assertTrue(anulada.cancelled());
        assertFalse(Sale.create(d, Instant.EPOCH).cancelled());
    }
}

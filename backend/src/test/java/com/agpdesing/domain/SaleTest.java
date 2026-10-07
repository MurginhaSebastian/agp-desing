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

import static org.junit.jupiter.api.Assertions.assertEquals;
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
}

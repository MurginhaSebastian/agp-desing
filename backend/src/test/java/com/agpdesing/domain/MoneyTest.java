package com.agpdesing.domain;

import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.model.Money;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MoneyTest {

    @ParameterizedTest
    @ValueSource(longs = {0, -1, Long.MIN_VALUE})
    void importeCeroONegativoSeRechaza(long cents) {
        var e = assertThrows(DomainValidationException.class, () -> new Money(cents, Money.Currency.PEN));
        assertEquals("priceCents", e.field());
    }

    @ParameterizedTest
    @ValueSource(longs = {1, Long.MAX_VALUE})
    void importeDesdeUnCentavoVale(long cents) {
        assertDoesNotThrow(() -> new Money(cents, Money.Currency.USD));
    }

    @Test
    void sinMonedaSeRechaza() {
        var e = assertThrows(DomainValidationException.class, () -> new Money(100, null));
        assertEquals("currency", e.field());
    }

    @Test
    void sePareceSoloSiImporteYMonedaCoinciden() {
        assertEquals(new Money(100, Money.Currency.PEN), new Money(100, Money.Currency.PEN));
        assertNotEquals(new Money(100, Money.Currency.PEN), new Money(100, Money.Currency.USD));
        assertNotEquals(new Money(100, Money.Currency.PEN), new Money(101, Money.Currency.PEN));
    }
}

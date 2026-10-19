package com.agpdesing.domain;

import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.model.UrlPublica;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class UrlPublicaTest {

    @Test
    void devuelveLaDireccionSinEspaciosAlrededor() {
        assertEquals("/img/a.jpg", UrlPublica.validar("imageUrl", "  /img/a.jpg \n"));
    }

    @Test
    void nullSeTrataComoVacioYSeRechaza() {
        var e = assertThrows(DomainValidationException.class, () -> UrlPublica.validar("heroImageUrl", null));
        assertEquals("heroImageUrl", e.field());
    }

    // El esquema se compara tal cual: «HTTP://» con mayúsculas tampoco pasa.
    @ParameterizedTest
    @ValueSource(strings = {"HTTP://x.com/a", "img/a.jpg", "data:image/png;base64,AAA", "mailto:a@b.c", "ftp://x/a"})
    void esquemasORutasRelativasSinBarraSeRechazan(String url) {
        assertThrows(DomainValidationException.class, () -> UrlPublica.validar("imageUrl", url));
    }

    @Test
    void elLimiteDeLargoEsExactamente500() {
        String justo = "/" + "a".repeat(UrlPublica.MAX - 1);
        assertEquals(justo, UrlPublica.validar("imageUrl", justo));
        var e = assertThrows(DomainValidationException.class, () -> UrlPublica.validar("imageUrl", justo + "a"));
        assertEquals("imageUrl", e.field());
    }

    @Test
    void elLargoSeCuentaSinLosEspacios() {
        String justo = "/" + "a".repeat(UrlPublica.MAX - 1);
        assertEquals(justo, UrlPublica.validar("imageUrl", "   " + justo + "   "));
    }
}

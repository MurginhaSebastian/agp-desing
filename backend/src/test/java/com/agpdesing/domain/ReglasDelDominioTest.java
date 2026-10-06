package com.agpdesing.domain;

import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.domain.model.SiteSettings;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Las reglas que antes solo comprobaba el DTO (y por tanto se saltaban si se llegaba al dominio por
 * otro camino) ahora viven en el dominio, igual que en el formulario.
 */
class ReglasDelDominioTest {

    private static Product obra(int ancho, int alto, String foto) {
        return Product.create("Seda I", "", new Money(100, Money.Currency.PEN), ancho, alto, "Acrílico", foto,
                ProductStatus.AVAILABLE, false, Instant.EPOCH);
    }

    @ParameterizedTest
    @ValueSource(ints = {1001, 5000})
    void medidasDeMasDeUnMetroSeRechazan(int cm) {
        var e = assertThrows(DomainValidationException.class, () -> obra(cm, 10, "/a.jpg"));
        assertEquals("widthCm", e.field());
        assertEquals("heightCm", assertThrows(DomainValidationException.class, () -> obra(10, cm, "/a.jpg")).field());
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 1000})
    void medidasEnElLimiteValen(int cm) {
        assertDoesNotThrow(() -> obra(cm, cm, "/a.jpg"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/", "http://", "https://", "  /  ", "ftp://x", "javascript:alert(1)", ""})
    void fotoSinDireccionDeVerdadSeRechaza(String url) {
        var e = assertThrows(DomainValidationException.class, () -> obra(10, 10, url));
        assertEquals("imageUrl", e.field());
    }

    @ParameterizedTest
    @ValueSource(strings = {"/a.jpg", "//cdn.x/a.jpg", "http://x", "https://cdn.example/a.jpg"})
    void fotoConDireccionVale(String url) {
        assertDoesNotThrow(() -> obra(10, 10, url));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/", "http://", "https://", "javascript:alert(1)"})
    void portadaSinDireccionDeVerdadSeRechaza(String url) {
        var e = assertThrows(DomainValidationException.class, () -> new SiteSettings(url));
        assertEquals("heroImageUrl", e.field());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void portadaVaciaSignificaSinImagen(String url) {
        assertEquals("", new SiteSettings(url).heroImageUrl());
    }

    @ParameterizedTest
    @ValueSource(ints = {500, 501})
    void direccionDeMasDe500CaracteresSeRechaza(int largo) {
        String url = "https://x/" + "a".repeat(largo - 10);
        if (largo <= 500) {
            assertDoesNotThrow(() -> obra(10, 10, url));
            assertDoesNotThrow(() -> new SiteSettings(url));
        } else {
            assertThrows(DomainValidationException.class, () -> obra(10, 10, url));
            assertThrows(DomainValidationException.class, () -> new SiteSettings(url));
        }
    }
}

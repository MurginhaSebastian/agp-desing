package com.agpdesing.domain;

import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.Instant;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductTest {

    private static final Money PRECIO = new Money(100, Money.Currency.PEN);
    private static final Instant T0 = Instant.parse("2026-01-01T00:00:00Z");
    private static final Instant T1 = Instant.parse("2026-02-01T00:00:00Z");

    private static Product obra(String nombre) {
        return Product.create(nombre, "desc", PRECIO, 30, 40, "Óleo", "/a.jpg", ProductStatus.AVAILABLE, false, T0);
    }

    private static Product conMedidas(int ancho, int alto) {
        return Product.create("Seda", "", PRECIO, ancho, alto, "Óleo", "/a.jpg", ProductStatus.AVAILABLE, false, T0);
    }

    private static Product conTecnica(String tecnica) {
        return Product.create("Seda", "", PRECIO, 10, 10, tecnica, "/a.jpg", ProductStatus.AVAILABLE, false, T0);
    }

    private static Product conDescripcion(String d) {
        return Product.create("Seda", d, PRECIO, 10, 10, "Óleo", "/a.jpg", ProductStatus.AVAILABLE, false, T0);
    }

    private static String campo(Runnable r) {
        return assertThrows(DomainValidationException.class, r::run).field();
    }

    // --- slugify ---

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "Seda I|seda-i",
            "  Atardecer  en el Cusco  |atardecer-en-el-cusco",
            "Ñandú Rojo|nandu-rojo",
            "¡Mar & Cielo!|mar-cielo",
            "---abc---|abc",
            "Obra 2026|obra-2026",
            "!!!|obra"})
    void slugifyNormalizaTildesSignosYBordes(String nombre, String esperado) {
        assertEquals(esperado, Product.slugify(nombre));
    }

    // --- creación ---

    @Test
    void createGeneraIdSlugYMarcasDeTiempo() {
        Product p = obra("  Seda I  ");
        assertEquals("Seda I", p.name());
        assertEquals("seda-i", p.slug());
        assertEquals(T0, p.createdAt());
        assertEquals(T0, p.updatedAt());
        assertNotEquals(obra("Seda I").id(), p.id(), "cada obra nace con su propio id");
    }

    @Test
    void rehydrateConservaElSlugGuardado() {
        ProductId id = ProductId.newId();
        Product p = Product.rehydrate(id, "Nombre Nuevo", "nombre-viejo", "", PRECIO, 10, 10, "Óleo", "/a.jpg",
                ProductStatus.SOLD, true, T0, T1);
        assertEquals("nombre-viejo", p.slug());
        assertEquals(id, p.id());
        assertEquals(T1, p.updatedAt());
        assertTrue(p.featured());
    }

    @Test
    void descripcionNulaQuedaVacia() {
        assertEquals("", conDescripcion(null).description());
    }

    // --- límites de texto ---

    @Test
    void nombreDeDosCaracteresValeYDeUnoNo() {
        assertDoesNotThrow(() -> obra("Ab"));
        assertEquals("name", campo(() -> obra("A")));
        assertEquals("name", campo(() -> obra("   ")));
        assertEquals("name", campo(() -> obra(null)));
        assertEquals("name", campo(() -> obra(" a ")), "el largo se mide sin espacios");
    }

    @Test
    void nombreDe120ValeY121No() {
        assertDoesNotThrow(() -> obra("a".repeat(Product.NAME_MAX)));
        assertEquals("name", campo(() -> obra("a".repeat(Product.NAME_MAX + 1))));
    }

    @Test
    void descripcionDe2000ValeY2001No() {
        assertDoesNotThrow(() -> conDescripcion("a".repeat(Product.DESCRIPTION_MAX)));
        assertEquals("description", campo(() -> conDescripcion("a".repeat(Product.DESCRIPTION_MAX + 1))));
    }

    @Test
    void tecnicaObligatoriaYConTopeDe80() {
        assertEquals("technique", campo(() -> conTecnica("  ")));
        assertEquals("technique", campo(() -> conTecnica(null)));
        assertDoesNotThrow(() -> conTecnica("t".repeat(Product.TECHNIQUE_MAX)));
        assertEquals("technique", campo(() -> conTecnica("t".repeat(Product.TECHNIQUE_MAX + 1))));
    }

    // --- medidas y nulos ---

    @Test
    void medidasCeroONegativasSeRechazanSenalandoElCampo() {
        assertEquals("widthCm", campo(() -> conMedidas(0, 10)));
        assertEquals("widthCm", campo(() -> conMedidas(-5, 10)));
        assertEquals("heightCm", campo(() -> conMedidas(10, 0)));
        assertEquals("heightCm", campo(() -> conMedidas(10, -1)));
    }

    @Test
    void obraSinPrecioEstadoOFechaNoSeCrea() {
        assertThrows(NullPointerException.class, () -> Product.create("Seda", "", null, 10, 10, "Óleo", "/a.jpg", ProductStatus.AVAILABLE, false, T0));
        assertThrows(NullPointerException.class, () -> Product.create("Seda", "", PRECIO, 10, 10, "Óleo", "/a.jpg", null, false, T0));
        assertThrows(NullPointerException.class, () -> Product.create("Seda", "", PRECIO, 10, 10, "Óleo", "/a.jpg", ProductStatus.AVAILABLE, false, null));
    }

    // --- update ---

    @Test
    void renombrarNoCambiaElSlugPeroSiLaFechaDeEdicion() {
        Product p = obra("Seda I");
        p.update("Seda Dos", "nueva", new Money(500, Money.Currency.USD), 50, 60, "Acrílico", "/b.jpg",
                ProductStatus.COMMISSION, true, T1);
        assertEquals("Seda Dos", p.name());
        assertEquals("seda-i", p.slug(), "la dirección pública no debe cambiar");
        assertEquals(500, p.price().cents());
        assertEquals(50, p.widthCm());
        assertEquals("/b.jpg", p.imageUrl());
        assertEquals(ProductStatus.COMMISSION, p.status());
        assertTrue(p.featured());
        assertEquals(T0, p.createdAt());
        assertEquals(T1, p.updatedAt());
    }

    @Test
    void updateInvalidoLanzaYNoTocaLaFechaDeEdicion() {
        Product p = obra("Seda I");
        assertEquals("widthCm", campo(() -> p.update("Seda I", "", PRECIO, 1001, 10, "Óleo", "/a.jpg", ProductStatus.AVAILABLE, false, T1)));
        assertEquals(T0, p.updatedAt());
    }

    @Test
    void changeStatusSoloCambiaEstadoYFecha() {
        Product p = obra("Seda I");
        p.changeStatus(ProductStatus.SOLD, T1);
        assertEquals(ProductStatus.SOLD, p.status());
        assertEquals(T1, p.updatedAt());
        assertEquals("Seda I", p.name());
        assertThrows(NullPointerException.class, () -> p.changeStatus(null, T1));
    }

    // --- seLlamaComo / slug libre ---

    @Test
    void seLlamaComoIgnoraMayusculasTildesYSignos() {
        assertTrue(obra("Seda I").seLlamaComo(obra("  seda   i! ")));
        assertTrue(obra("Atardecer").seLlamaComo(obra("ATARDÉCER")));
        assertFalse(obra("Seda I").seLlamaComo(obra("Seda II")));
    }

    @Test
    void elegirSlugLibreAnadeSufijoHastaEncontrarHueco() {
        Product p = obra("Seda I");
        p.elegirSlugLibre(s -> false);
        assertEquals("seda-i", p.slug());

        p.elegirSlugLibre(Set.of("seda-i")::contains);
        assertEquals("seda-i-2", p.slug());

        p.elegirSlugLibre(Set.of("seda-i", "seda-i-2", "seda-i-3")::contains);
        assertEquals("seda-i-4", p.slug());
    }
}

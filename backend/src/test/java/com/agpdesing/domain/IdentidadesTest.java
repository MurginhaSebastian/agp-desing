package com.agpdesing.domain;

import com.agpdesing.domain.model.AdminUser;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.SaleId;
import com.agpdesing.domain.model.SiteSettings;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Identidades, usuario admin y ajustes: objetos de valor pequeños con sus bordes. */
class IdentidadesTest {

    @Test
    void productIdSinValorSeRechaza() {
        assertThrows(NullPointerException.class, () -> new ProductId(null));
    }

    @Test
    void productIdOfLeeUnUuidYRechazaBasura() {
        UUID u = UUID.randomUUID();
        assertEquals(new ProductId(u), ProductId.of(u.toString()));
        assertThrows(IllegalArgumentException.class, () -> ProductId.of("no-es-un-uuid"));
        assertThrows(NullPointerException.class, () -> ProductId.of(null));
    }

    @Test
    void losIdsNuevosSonDistintos() {
        assertNotEquals(ProductId.newId(), ProductId.newId());
        assertNotEquals(SaleId.newId(), SaleId.newId());
    }

    @Test
    void saleIdSinValorSeRechaza() {
        assertThrows(NullPointerException.class, () -> new SaleId(null));
    }

    @Test
    void adminUserExigeUsuarioYHash() {
        assertThrows(NullPointerException.class, () -> new AdminUser(null, "hash"));
        assertThrows(NullPointerException.class, () -> new AdminUser("admin", null));
        assertEquals("admin", new AdminUser("admin", "hash").username());
    }

    @Test
    void ajustesVaciosNoTienenImagen() {
        assertFalse(SiteSettings.empty().hasHeroImage());
        assertEquals("", new SiteSettings(null).heroImageUrl());
    }

    @Test
    void ajustesConImagenLaRecortanYLaReportan() {
        SiteSettings s = new SiteSettings("  /portada.jpg ");
        assertTrue(s.hasHeroImage());
        assertEquals("/portada.jpg", s.heroImageUrl());
    }
}

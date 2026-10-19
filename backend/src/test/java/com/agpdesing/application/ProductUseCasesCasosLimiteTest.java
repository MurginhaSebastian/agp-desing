package com.agpdesing.application;

import com.agpdesing.application.usecase.product.CreateProductUseCase;
import com.agpdesing.application.usecase.product.ListProductsUseCase;
import com.agpdesing.application.usecase.product.ProductCommand;
import com.agpdesing.application.usecase.product.UpdateProductUseCase;
import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductStatus;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Casos límite de alta, edición y listado que {@link ProductUseCasesTest} no ejercita. */
class ProductUseCasesCasosLimiteTest {

    private final CreateProductUseCaseTest.InMemoryProducts repo = new CreateProductUseCaseTest.InMemoryProducts();
    private final Clock clock = Clock.fixed(Instant.parse("2026-09-21T10:00:00Z"), ZoneOffset.UTC);
    private final CreateProductUseCase create = new CreateProductUseCase(repo, clock, new TransaccionesDePrueba());
    private final UpdateProductUseCase update = new UpdateProductUseCase(repo, clock, new TransaccionesDePrueba());

    private static ProductCommand command(String name) {
        return new ProductCommand(name, "desc", 95_000, Money.Currency.PEN, 80, 100, "Acrílico", "/images/a.jpg",
                ProductStatus.AVAILABLE, false);
    }

    @Test
    void listOfAnEmptyCatalogIsEmpty() {
        assertTrue(new ListProductsUseCase(repo).execute().isEmpty());
    }

    @Test
    void namesThatDifferOnlyInAccentsAndCaseAreTheSameName() {
        create.execute(command("Atardecer"));
        SlugAlreadyExistsException e = assertThrows(SlugAlreadyExistsException.class, () -> create.execute(command("ATARDÉCER")));
        assertTrue(e.getMessage().contains("atardecer"), e.getMessage());
        assertEquals(1, repo.findAll().size());
    }

    @Test
    void aThirdProductWithTheSameFreedNameGetsSuffixThree() {
        Product a = create.execute(command("Seda I"));
        update.execute(a.id(), command("Bruma"));
        Product b = create.execute(command("Seda I")); // seda-i-2
        update.execute(b.id(), command("Avena"));

        assertEquals("seda-i-3", create.execute(command("Seda I")).slug());
    }

    @Test
    void invalidCreateReportsTheRightFieldAndStoresNothing() {
        DomainValidationException e = assertThrows(DomainValidationException.class, () -> create.execute(command("A")));
        assertEquals("name", e.field());
        assertTrue(repo.findAll().isEmpty());
    }

    @Test
    void invalidUpdateReportsTheField() {
        Product p = create.execute(command("Seda I"));
        ProductCommand malo = new ProductCommand("Seda II", "", 95_000, Money.Currency.PEN, 0, 100, "Acrílico",
                "/images/a.jpg", ProductStatus.AVAILABLE, false);

        DomainValidationException e = assertThrows(DomainValidationException.class, () -> update.execute(p.id(), malo));

        assertEquals("widthCm", e.field());
    }

    @Test
    void duplicateOnUpdateNamesTheConflictingSlug() {
        create.execute(command("Seda I"));
        Product other = create.execute(command("Bruma"));
        SlugAlreadyExistsException e = assertThrows(SlugAlreadyExistsException.class,
                () -> update.execute(other.id(), command("  SEDA   i ")));
        assertTrue(e.getMessage().contains("seda-i"), e.getMessage());
    }
}

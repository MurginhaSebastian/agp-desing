package com.agpdesing.application;

import com.agpdesing.application.usecase.product.CreateProductUseCase;
import com.agpdesing.application.usecase.product.DeleteProductUseCase;
import com.agpdesing.application.usecase.product.GetProductUseCase;
import com.agpdesing.application.usecase.product.ListProductsUseCase;
import com.agpdesing.application.usecase.product.ProductCommand;
import com.agpdesing.application.usecase.product.UpdateProductUseCase;
import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Fija lo que hacen hoy editar, borrar, leer y listar, para poder reorganizar el código por
 * dentro sin cambiar nada por fuera.
 */
class ProductUseCasesTest {

    private final CreateProductUseCaseTest.InMemoryProducts repo = new CreateProductUseCaseTest.InMemoryProducts();
    private final MutableClock clock = new MutableClock(Instant.parse("2026-09-21T10:00:00Z"));

    private final CreateProductUseCase create = new CreateProductUseCase(repo, clock);
    private final UpdateProductUseCase update = new UpdateProductUseCase(repo, clock);
    private final DeleteProductUseCase delete = new DeleteProductUseCase(repo);
    private final GetProductUseCase get = new GetProductUseCase(repo);
    private final ListProductsUseCase list = new ListProductsUseCase(repo);

    @Test
    void updateRegeneratesSlugAndTouchesOnlyUpdatedAt() {
        Product p = create.execute(command("Seda I", false));
        clock.now = Instant.parse("2026-09-22T08:00:00Z");

        Product updated = update.execute(p.id(), command("Seda Dos", true));

        assertEquals("seda-dos", updated.slug());
        assertEquals(Instant.parse("2026-09-21T10:00:00Z"), updated.createdAt());
        assertEquals(Instant.parse("2026-09-22T08:00:00Z"), updated.updatedAt());
        assertTrue(updated.featured());
    }

    @Test
    void updateKeepingItsOwnNameIsNotADuplicate() {
        Product p = create.execute(command("Seda I", false));
        Product updated = update.execute(p.id(), command("Seda I", true));
        assertEquals("seda-i", updated.slug());
    }

    @Test
    void updateToAnotherProductsSlugIsRejected() {
        create.execute(command("Seda I", false));
        Product other = create.execute(command("Bruma", false));
        assertThrows(SlugAlreadyExistsException.class, () -> update.execute(other.id(), command("Seda i", false)));
    }

    @Test
    void updateUnknownIdIsNotFound() {
        assertThrows(ProductNotFoundException.class, () -> update.execute(ProductId.newId(), command("Seda I", false)));
    }

    @Test
    void deleteRemovesAndUnknownIdIsNotFound() {
        Product p = create.execute(command("Seda I", false));
        delete.execute(p.id());
        assertTrue(repo.findAll().isEmpty());
        assertThrows(ProductNotFoundException.class, () -> delete.execute(p.id()));
    }

    @Test
    void getByIdAndBySlug() {
        Product p = create.execute(command("Tarde en Bordeaux", false));
        assertEquals(p.id(), get.byId(p.id()).id());
        assertEquals(p.id(), get.bySlug("tarde-en-bordeaux").id());
        assertThrows(ProductNotFoundException.class, () -> get.byId(ProductId.newId()));
        assertThrows(ProductNotFoundException.class, () -> get.bySlug("no-existe"));
    }

    @Test
    void listPutsFeaturedFirstThenNewest() {
        create.execute(command("Vieja normal", false));
        clock.now = Instant.parse("2026-09-22T10:00:00Z");
        create.execute(command("Vieja destacada", true));
        clock.now = Instant.parse("2026-09-23T10:00:00Z");
        create.execute(command("Nueva normal", false));
        clock.now = Instant.parse("2026-09-24T10:00:00Z");
        create.execute(command("Nueva destacada", true));

        List<String> names = list.execute().stream().map(Product::name).toList();

        assertEquals(List.of("Nueva destacada", "Vieja destacada", "Nueva normal", "Vieja normal"), names);
    }

    private static ProductCommand command(String name, boolean featured) {
        return new ProductCommand(name, "desc", 95_000, Money.Currency.PEN, 80, 100, "Acrílico", "/images/a.jpg",
                ProductStatus.AVAILABLE, featured);
    }

    /** Reloj que se puede adelantar entre llamadas. */
    static final class MutableClock extends Clock {
        Instant now;

        MutableClock(Instant start) { this.now = start; }

        @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}

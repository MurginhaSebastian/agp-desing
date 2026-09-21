package com.agpdesing.application;

import com.agpdesing.application.usecase.product.CreateProductUseCase;
import com.agpdesing.application.usecase.product.ProductCommand;
import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.domain.repository.ProductRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** Sin Spring, sin base de datos: un repositorio en memoria basta porque el caso de uso depende del puerto. */
class CreateProductUseCaseTest {

    private final InMemoryProducts repo = new InMemoryProducts();
    private final Clock clock = Clock.fixed(Instant.parse("2026-09-21T10:00:00Z"), ZoneOffset.UTC);
    private final CreateProductUseCase useCase = new CreateProductUseCase(repo, clock);

    @Test
    void createsProductWithSlugAndTimestamps() {
        Product p = useCase.execute(command("Tarde en Bordeaux"));

        assertEquals("tarde-en-bordeaux", p.slug());
        assertEquals(Instant.parse("2026-09-21T10:00:00Z"), p.createdAt());
        assertEquals(1, repo.findAll().size());
    }

    @Test
    void rejectsDuplicateSlug() {
        useCase.execute(command("Seda I"));
        assertThrows(SlugAlreadyExistsException.class, () -> useCase.execute(command("Seda i")));
    }

    @Test
    void rejectsInvalidPrice() {
        ProductCommand bad = new ProductCommand("Ok", "", 0, Money.Currency.PEN, 10, 10, "Óleo", "/x.jpg", ProductStatus.AVAILABLE, false);
        assertThrows(DomainValidationException.class, () -> useCase.execute(bad));
    }

    private static ProductCommand command(String name) {
        return new ProductCommand(name, "desc", 95_000, Money.Currency.PEN, 80, 100, "Acrílico", "/images/a.jpg", ProductStatus.AVAILABLE, true);
    }

    static final class InMemoryProducts implements ProductRepository {
        private final Map<ProductId, Product> store = new HashMap<>();

        @Override public Product save(Product product) { store.put(product.id(), product); return product; }
        @Override public Optional<Product> findById(ProductId id) { return Optional.ofNullable(store.get(id)); }
        @Override public Optional<Product> findBySlug(String slug) {
            return store.values().stream().filter(p -> p.slug().equals(slug)).findFirst();
        }
        @Override public boolean existsBySlugAndIdNot(String slug, ProductId id) {
            return store.values().stream().anyMatch(p -> p.slug().equals(slug) && !p.id().equals(id));
        }
        @Override public List<Product> findAll() { return List.copyOf(store.values()); }
        @Override public void deleteById(ProductId id) { store.remove(id); }
    }
}

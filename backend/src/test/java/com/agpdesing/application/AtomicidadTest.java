package com.agpdesing.application;

import com.agpdesing.application.usecase.product.CreateProductUseCase;
import com.agpdesing.application.usecase.product.DeleteProductUseCase;
import com.agpdesing.application.usecase.product.ProductCommand;
import com.agpdesing.application.usecase.product.UpdateProductUseCase;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.domain.repository.ProductRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Comprobar que el nombre no está repetido y guardar tienen que ir en UNA transacción: si van en
 * dos, otra alta puede colarse en medio con el mismo nombre.
 */
class AtomicidadTest {

    private final TransaccionesDePrueba tx = new TransaccionesDePrueba();
    private final Espia repo = new Espia(tx);
    private final Clock clock = Clock.fixed(Instant.parse("2026-09-21T10:00:00Z"), ZoneOffset.UTC);

    @Test
    void altaEnUnaSolaTransaccion() {
        new CreateProductUseCase(repo, clock, tx).execute(command("Seda I"));
        assertEquals(1, tx.abiertas);
        assertEquals(List.of("findBySlug", "save"), repo.llamadas);
        assertTrue(repo.todoDentro, "cada llamada al repositorio dentro de la transacción");
    }

    @Test
    void edicionEnUnaSolaTransaccion() {
        Product p = repo.inner.save(Product.create("Seda I", "", new Money(100, Money.Currency.PEN), 1, 1, "x",
                "/a.jpg", ProductStatus.AVAILABLE, false, Instant.EPOCH));
        new UpdateProductUseCase(repo, clock, tx).execute(p.id(), command("Seda II"));
        assertEquals(1, tx.abiertas);
        assertEquals(List.of("findById", "existsBySlugAndIdNot", "save"), repo.llamadas);
        assertTrue(repo.todoDentro);
    }

    @Test
    void borradoEnUnaSolaTransaccion() {
        Product p = repo.inner.save(Product.create("Seda I", "", new Money(100, Money.Currency.PEN), 1, 1, "x",
                "/a.jpg", ProductStatus.AVAILABLE, false, Instant.EPOCH));
        new DeleteProductUseCase(repo, tx).execute(p.id());
        assertEquals(1, tx.abiertas);
        assertEquals(List.of("findById", "deleteById"), repo.llamadas);
        assertTrue(repo.todoDentro);
    }

    private static ProductCommand command(String name) {
        return new ProductCommand(name, "", 9_500, Money.Currency.PEN, 30, 40, "Acrílico", "/a.jpg", ProductStatus.AVAILABLE, false);
    }

    /** Repositorio en memoria que apunta cada llamada y si llegó dentro de la transacción. */
    static final class Espia implements ProductRepository {
        final CreateProductUseCaseTest.InMemoryProducts inner = new CreateProductUseCaseTest.InMemoryProducts();
        final List<String> llamadas = new ArrayList<>();
        final TransaccionesDePrueba tx;
        boolean todoDentro = true;

        Espia(TransaccionesDePrueba tx) { this.tx = tx; }

        private void anotar(String metodo) {
            llamadas.add(metodo);
            todoDentro &= tx.dentro;
        }

        @Override public Product save(Product p) { anotar("save"); return inner.save(p); }
        @Override public Optional<Product> findById(ProductId id) { anotar("findById"); return inner.findById(id); }
        @Override public Optional<Product> findBySlug(String slug) { anotar("findBySlug"); return inner.findBySlug(slug); }
        @Override public boolean existsBySlugAndIdNot(String slug, ProductId id) { anotar("existsBySlugAndIdNot"); return inner.existsBySlugAndIdNot(slug, id); }
        @Override public List<Product> findAll() { anotar("findAll"); return inner.findAll(); }
        @Override public void deleteById(ProductId id) { anotar("deleteById"); inner.deleteById(id); }
    }
}

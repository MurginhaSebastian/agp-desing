package com.agpdesing.infrastructure;

import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.infrastructure.persistence.adapter.ProductRepositoryImpl;
import com.agpdesing.infrastructure.persistence.mapper.ProductPersistenceMapper;
import com.agpdesing.infrastructure.persistence.springdata.SpringDataProductRepository;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.sql.SQLException;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Dos altas a la vez con el mismo nombre: las dos pasan la comprobación previa y la base de datos
 * rechaza la segunda por la restricción única de `slug`. Eso es un 409 (nombre repetido), no un 500.
 */
class ProductRepositoryImplTest {

    private final SpringDataProductRepository jpa = mock(SpringDataProductRepository.class);
    private final ProductRepositoryImpl repo = new ProductRepositoryImpl(jpa, new ProductPersistenceMapper());
    private final Product obra = Product.create("Seda I", "", new Money(100, Money.Currency.PEN), 1, 1, "x", "/a.jpg",
            ProductStatus.AVAILABLE, false, Instant.EPOCH);

    private static DataIntegrityViolationException violacion(String restriccion) {
        var causa = new ConstraintViolationException("duplicate key", new SQLException("duplicate key", "23505"), restriccion);
        return new DataIntegrityViolationException("could not execute statement", causa);
    }

    @Test
    void elSlugRepetidoEnLaBaseDeDatosEsNombreRepetido() {
        when(jpa.saveAndFlush(any())).thenThrow(violacion("products_slug_key"));
        assertThrows(SlugAlreadyExistsException.class, () -> repo.save(obra));
    }

    @Test
    void otrasRestriccionesSiguenSiendoErroresDelServidor() {
        DataIntegrityViolationException otra = violacion("products_price_cents_check");
        when(jpa.saveAndFlush(any())).thenThrow(otra);
        assertSame(otra, assertThrows(DataIntegrityViolationException.class, () -> repo.save(obra)));
    }
}

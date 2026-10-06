package com.agpdesing.infrastructure.persistence.adapter;

import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.repository.ProductRepository;
import com.agpdesing.infrastructure.persistence.mapper.ProductPersistenceMapper;
import com.agpdesing.infrastructure.persistence.springdata.SpringDataProductRepository;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * ADAPTADOR: cumple el puerto del dominio usando Spring Data JPA.
 * Es el único punto donde el dominio toca la base de datos. Los casos de uso
 * dependen de ProductRepository (la interfaz), nunca de esta clase.
 * Migrar a otra base de datos = escribir otro adaptador; dominio y casos de uso no cambian.
 */
@Component
@Transactional
public class ProductRepositoryImpl implements ProductRepository {

    /** Nombre que Postgres le da a la restricción UNIQUE de `slug` (V1__create_products.sql). */
    private static final String RESTRICCION_SLUG = "products_slug_key";

    private final SpringDataProductRepository jpa;
    private final ProductPersistenceMapper mapper;

    public ProductRepositoryImpl(SpringDataProductRepository jpa, ProductPersistenceMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    public Product save(Product product) {
        /*
         * `saveAndFlush` y no `save`: así la base de datos responde aquí y no al cerrar la
         * transacción. Si dos altas con el mismo nombre pasan a la vez la comprobación del caso de
         * uso, la segunda choca con la restricción única y se traduce al mismo «nombre repetido»
         * (409) que da la comprobación normal, en vez de un 500.
         */
        try {
            return mapper.toDomain(jpa.saveAndFlush(mapper.toEntity(product)));
        } catch (DataIntegrityViolationException e) {
            if (e.getCause() instanceof ConstraintViolationException c
                    && RESTRICCION_SLUG.equalsIgnoreCase(c.getConstraintName())) {
                throw new SlugAlreadyExistsException(product.slug());
            }
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Product> findById(ProductId id) {
        return jpa.findById(id.value()).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Product> findBySlug(String slug) {
        return jpa.findBySlug(slug).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsBySlugAndIdNot(String slug, ProductId id) {
        return jpa.existsBySlugAndIdNot(slug, id.value());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> findAll() {
        return jpa.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(ProductId id) {
        jpa.deleteById(id.value());
    }
}

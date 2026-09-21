package com.agpdesing.infrastructure.persistence.adapter;

import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.repository.ProductRepository;
import com.agpdesing.infrastructure.persistence.mapper.ProductPersistenceMapper;
import com.agpdesing.infrastructure.persistence.springdata.SpringDataProductRepository;
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

    private final SpringDataProductRepository jpa;
    private final ProductPersistenceMapper mapper;

    public ProductRepositoryImpl(SpringDataProductRepository jpa, ProductPersistenceMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    public Product save(Product product) {
        return mapper.toDomain(jpa.save(mapper.toEntity(product)));
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

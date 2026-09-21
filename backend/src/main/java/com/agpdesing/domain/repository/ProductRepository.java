package com.agpdesing.domain.repository;

import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;

import java.util.List;
import java.util.Optional;

/**
 * PUERTO de persistencia. El dominio define el contrato; la infraestructura
 * lo implementa (ProductRepositoryImpl). Cero referencias a JPA aquí.
 */
public interface ProductRepository {
    Product save(Product product);
    Optional<Product> findById(ProductId id);
    Optional<Product> findBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, ProductId id);
    List<Product> findAll();
    void deleteById(ProductId id);
}

package com.agpdesing.infrastructure.persistence.springdata;

import com.agpdesing.infrastructure.persistence.entity.ProductJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Métodos derivados = consultas parametrizadas generadas por Spring Data.
 * Nunca concatenar SQL aquí ni en ningún otro sitio.
 */
public interface SpringDataProductRepository extends JpaRepository<ProductJpaEntity, UUID> {
    Optional<ProductJpaEntity> findBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, UUID id);
}

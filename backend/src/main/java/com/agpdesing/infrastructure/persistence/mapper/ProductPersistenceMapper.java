package com.agpdesing.infrastructure.persistence.mapper;

import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.infrastructure.persistence.entity.ProductJpaEntity;
import org.springframework.stereotype.Component;

/** Traduce dominio <-> entidad JPA. El único sitio que conoce a las dos. */
@Component
public class ProductPersistenceMapper {

    public ProductJpaEntity toEntity(Product p) {
        return new ProductJpaEntity(
                p.id().value(), p.name(), p.slug(), p.description(),
                p.price().cents(), p.price().currency().name(),
                p.widthCm(), p.heightCm(), p.technique(), p.imageUrl(),
                p.status().name(), p.featured(), p.createdAt(), p.updatedAt());
    }

    public Product toDomain(ProductJpaEntity e) {
        return Product.rehydrate(
                new ProductId(e.getId()), e.getName(), e.getSlug(), e.getDescription(),
                new Money(e.getPriceCents(), Money.Currency.valueOf(e.getCurrency())),
                e.getWidthCm(), e.getHeightCm(), e.getTechnique(), e.getImageUrl(),
                ProductStatus.valueOf(e.getStatus()), e.isFeatured(), e.getCreatedAt(), e.getUpdatedAt());
    }
}

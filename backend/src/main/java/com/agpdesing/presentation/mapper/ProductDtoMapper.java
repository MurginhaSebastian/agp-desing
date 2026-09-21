package com.agpdesing.presentation.mapper;

import com.agpdesing.domain.model.Product;
import com.agpdesing.presentation.dto.response.ProductResponse;
import org.springframework.stereotype.Component;

@Component
public class ProductDtoMapper {

    public ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.id().value().toString(), p.name(), p.slug(), p.description(),
                p.price().cents(), p.price().currency().name(),
                p.widthCm(), p.heightCm(), p.technique(), p.imageUrl(),
                p.status().name(), p.featured(), p.createdAt(), p.updatedAt());
    }
}

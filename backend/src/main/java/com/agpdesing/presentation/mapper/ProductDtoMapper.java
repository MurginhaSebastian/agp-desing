package com.agpdesing.presentation.mapper;

import com.agpdesing.application.usecase.product.ProductCommand;
import com.agpdesing.domain.model.Product;
import com.agpdesing.presentation.dto.request.ProductRequest;
import com.agpdesing.presentation.dto.response.ProductResponse;
import org.springframework.stereotype.Component;

/** Traduce JSON <-> núcleo para /api/products. Los DTO se quedan como datos puros. */
@Component
public class ProductDtoMapper {

    public ProductCommand toCommand(ProductRequest r) {
        return new ProductCommand(r.name(), r.description() == null ? "" : r.description(), r.priceCents(), r.currency(),
                r.widthCm(), r.heightCm(), r.technique(), r.imageUrl(), r.status(), r.featured());
    }

    public ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.id().value().toString(), p.name(), p.slug(), p.description(),
                p.price().cents(), p.price().currency().name(),
                p.widthCm(), p.heightCm(), p.technique(), p.imageUrl(),
                p.status().name(), p.featured(), p.createdAt(), p.updatedAt());
    }
}

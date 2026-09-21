package com.agpdesing.application.usecase.product;

import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.repository.ProductRepository;

import java.time.Clock;
import java.time.Instant;

public class UpdateProductUseCase {

    private final ProductRepository products;
    private final Clock clock;

    public UpdateProductUseCase(ProductRepository products, Clock clock) {
        this.products = products;
        this.clock = clock;
    }

    public Product execute(ProductId id, ProductCommand cmd) {
        Product product = products.findById(id).orElseThrow(() -> new ProductNotFoundException(id.value().toString()));
        product.update(cmd.name(), cmd.description(), cmd.price(), cmd.widthCm(), cmd.heightCm(),
                cmd.technique(), cmd.imageUrl(), cmd.status(), cmd.featured(), Instant.now(clock));
        if (products.existsBySlugAndIdNot(product.slug(), id)) {
            throw new SlugAlreadyExistsException(product.slug());
        }
        return products.save(product);
    }
}

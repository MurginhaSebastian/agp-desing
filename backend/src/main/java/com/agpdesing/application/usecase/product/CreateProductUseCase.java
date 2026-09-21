package com.agpdesing.application.usecase.product;

import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.repository.ProductRepository;

import java.time.Clock;
import java.time.Instant;

/** POJO puro: se instancia en UseCaseConfig, no lleva @Service. */
public class CreateProductUseCase {

    private final ProductRepository products;
    private final Clock clock;

    public CreateProductUseCase(ProductRepository products, Clock clock) {
        this.products = products;
        this.clock = clock;
    }

    public Product execute(ProductCommand cmd) {
        Product product = Product.create(cmd.name(), cmd.description(), cmd.price(), cmd.widthCm(), cmd.heightCm(),
                cmd.technique(), cmd.imageUrl(), cmd.status(), cmd.featured(), Instant.now(clock));
        if (products.findBySlug(product.slug()).isPresent()) {
            throw new SlugAlreadyExistsException(product.slug());
        }
        return products.save(product);
    }
}

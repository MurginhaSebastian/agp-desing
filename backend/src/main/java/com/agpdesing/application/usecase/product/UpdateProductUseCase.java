package com.agpdesing.application.usecase.product;

import com.agpdesing.application.port.out.Transacciones;
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
    private final Transacciones transacciones;

    public UpdateProductUseCase(ProductRepository products, Clock clock, Transacciones transacciones) {
        this.products = products;
        this.clock = clock;
        this.transacciones = transacciones;
    }

    public Product execute(ProductId id, ProductCommand cmd) {
        // Leer, comprobar el nombre y guardar en una sola transacción.
        return transacciones.enTransaccion(() -> {
            Product product = products.findById(id).orElseThrow(() -> new ProductNotFoundException(id.value().toString()));
            product.update(cmd.name(), cmd.description(), cmd.price(), cmd.widthCm(), cmd.heightCm(),
                    cmd.technique(), cmd.imageUrl(), cmd.status(), cmd.featured(), Instant.now(clock));
            if (products.existsBySlugAndIdNot(product.slug(), id)) {
                throw new SlugAlreadyExistsException(product.slug());
            }
            return products.save(product);
        });
    }
}

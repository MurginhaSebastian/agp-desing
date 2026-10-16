package com.agpdesing.application.usecase.product;

import com.agpdesing.application.port.out.Transacciones;
import com.agpdesing.domain.exception.SlugAlreadyExistsException;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.repository.ProductRepository;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

/** POJO puro: se instancia en UseCaseConfig, no lleva @Service. */
public class CreateProductUseCase {

    private final ProductRepository products;
    private final Clock clock;
    private final Transacciones transacciones;

    public CreateProductUseCase(ProductRepository products, Clock clock, Transacciones transacciones) {
        this.products = products;
        this.clock = clock;
        this.transacciones = transacciones;
    }

    public Product execute(ProductCommand cmd) {
        Product product = Product.create(cmd.name(), cmd.description(), cmd.price(), cmd.widthCm(), cmd.heightCm(),
                cmd.technique(), cmd.imageUrl(), cmd.status(), cmd.featured(), Instant.now(clock));
        // Comprobar y guardar juntos: si no, otra alta con el mismo nombre podía colarse en medio.
        return transacciones.enTransaccion(() -> {
            List<Product> todas = products.findAll();
            if (todas.stream().anyMatch(product::seLlamaComo)) {
                throw new SlugAlreadyExistsException(Product.slugify(product.name()));
            }
            product.elegirSlugLibre(slug -> todas.stream().anyMatch(o -> o.slug().equals(slug)));
            return products.save(product);
        });
    }
}

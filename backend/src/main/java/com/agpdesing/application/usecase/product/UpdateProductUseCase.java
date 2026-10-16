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
            // El slug no cambia al renombrar (ver Product.update), pero dos obras con el mismo
            // nombre se confundirían en el panel y en el catálogo: el nombre nuevo no puede ser el de otra.
            boolean repetido = products.findAll().stream().anyMatch(o -> !o.id().equals(id) && o.seLlamaComo(product));
            if (repetido) {
                throw new SlugAlreadyExistsException(Product.slugify(product.name()));
            }
            return products.save(product);
        });
    }
}

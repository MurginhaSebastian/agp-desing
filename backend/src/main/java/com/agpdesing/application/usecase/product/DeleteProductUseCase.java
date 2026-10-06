package com.agpdesing.application.usecase.product;

import com.agpdesing.application.port.out.Transacciones;
import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.repository.ProductRepository;

public class DeleteProductUseCase {

    private final ProductRepository products;
    private final Transacciones transacciones;

    public DeleteProductUseCase(ProductRepository products, Transacciones transacciones) {
        this.products = products;
        this.transacciones = transacciones;
    }

    public void execute(ProductId id) {
        transacciones.enTransaccion(() -> {
            if (products.findById(id).isEmpty()) {
                throw new ProductNotFoundException(id.value().toString());
            }
            products.deleteById(id);
        });
    }
}

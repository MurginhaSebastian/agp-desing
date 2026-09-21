package com.agpdesing.application.usecase.product;

import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.repository.ProductRepository;

public class DeleteProductUseCase {

    private final ProductRepository products;

    public DeleteProductUseCase(ProductRepository products) {
        this.products = products;
    }

    public void execute(ProductId id) {
        if (products.findById(id).isEmpty()) {
            throw new ProductNotFoundException(id.value().toString());
        }
        products.deleteById(id);
    }
}

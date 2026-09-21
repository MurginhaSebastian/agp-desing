package com.agpdesing.application.usecase.product;

import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.repository.ProductRepository;

public class GetProductUseCase {

    private final ProductRepository products;

    public GetProductUseCase(ProductRepository products) {
        this.products = products;
    }

    public Product byId(ProductId id) {
        return products.findById(id).orElseThrow(() -> new ProductNotFoundException(id.value().toString()));
    }

    public Product bySlug(String slug) {
        return products.findBySlug(slug).orElseThrow(() -> new ProductNotFoundException(slug));
    }
}

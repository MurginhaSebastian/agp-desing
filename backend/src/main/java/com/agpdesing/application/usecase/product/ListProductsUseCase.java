package com.agpdesing.application.usecase.product;

import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.repository.ProductRepository;

import java.util.Comparator;
import java.util.List;

public class ListProductsUseCase {

    private final ProductRepository products;

    public ListProductsUseCase(ProductRepository products) {
        this.products = products;
    }

    /** Destacados primero, luego los más recientes. */
    public List<Product> execute() {
        return products.findAll().stream()
                .sorted(Comparator.comparing(Product::featured).reversed()
                        .thenComparing(Product::createdAt, Comparator.reverseOrder()))
                .toList();
    }
}

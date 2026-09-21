package com.agpdesing.presentation.rest;

import com.agpdesing.application.usecase.product.CreateProductUseCase;
import com.agpdesing.application.usecase.product.DeleteProductUseCase;
import com.agpdesing.application.usecase.product.GetProductUseCase;
import com.agpdesing.application.usecase.product.ListProductsUseCase;
import com.agpdesing.application.usecase.product.UpdateProductUseCase;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.presentation.dto.request.ProductRequest;
import com.agpdesing.presentation.dto.response.ProductResponse;
import com.agpdesing.presentation.mapper.ProductDtoMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * GET lista y GET por slug son públicos (catálogo).
 * Todo lo demás exige ROLE_ADMIN — la regla está en SecurityConfig, no aquí.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ListProductsUseCase list;
    private final GetProductUseCase get;
    private final CreateProductUseCase create;
    private final UpdateProductUseCase update;
    private final DeleteProductUseCase delete;
    private final ProductDtoMapper mapper;

    public ProductController(ListProductsUseCase list, GetProductUseCase get, CreateProductUseCase create,
                             UpdateProductUseCase update, DeleteProductUseCase delete, ProductDtoMapper mapper) {
        this.list = list;
        this.get = get;
        this.create = create;
        this.update = update;
        this.delete = delete;
        this.mapper = mapper;
    }

    @GetMapping
    public List<ProductResponse> listAll() {
        return list.execute().stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/slug/{slug}")
    public ProductResponse bySlug(@PathVariable String slug) {
        return mapper.toResponse(get.bySlug(slug));
    }

    @GetMapping("/{id}")
    public ProductResponse byId(@PathVariable UUID id) {
        return mapper.toResponse(get.byId(new ProductId(id)));
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createOne(@Valid @RequestBody ProductRequest body) {
        Product created = create.execute(body.toCommand());
        return ResponseEntity
                .created(URI.create("/api/products/" + created.id().value()))
                .body(mapper.toResponse(created));
    }

    @PutMapping("/{id}")
    public ProductResponse updateOne(@PathVariable UUID id, @Valid @RequestBody ProductRequest body) {
        return mapper.toResponse(update.execute(new ProductId(id), body.toCommand()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOne(@PathVariable UUID id) {
        delete.execute(new ProductId(id));
    }
}

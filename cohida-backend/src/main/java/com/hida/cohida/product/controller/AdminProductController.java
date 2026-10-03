package com.hida.cohida.product.controller;

import com.hida.cohida.product.dto.ProductResponse;
import com.hida.cohida.product.dto.ProductUpsertRequest;
import com.hida.cohida.product.dto.ProductVariantResponse;
import com.hida.cohida.product.dto.StockUpdateRequest;
import com.hida.cohida.product.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {
    private final ProductService products;

    public AdminProductController(ProductService products) {
        this.products = products;
    }

    @GetMapping
    public List<ProductResponse> findAll() {
        return products.findAllForAdmin().stream().map(ProductResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ProductResponse findById(@PathVariable Long id) {
        return ProductResponse.from(products.findForAdmin(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@RequestBody ProductUpsertRequest request) {
        return ProductResponse.from(products.create(request));
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @RequestBody ProductUpsertRequest request) {
        return ProductResponse.from(products.update(id, request));
    }

    @PatchMapping("/{productId}/variants/{variantId}/stock")
    public ProductVariantResponse updateStock(@PathVariable Long productId, @PathVariable Long variantId,
                                              @RequestBody StockUpdateRequest request) {
        return ProductVariantResponse.from(products.updateStock(productId, variantId, request.stockQuantity()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) {
        products.deactivate(id);
    }
}

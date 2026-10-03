package com.hida.cohida.product.controller;

import com.hida.cohida.product.dto.ProductResponse;
import com.hida.cohida.product.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService products;

    public ProductController(ProductService products) {
        this.products = products;
    }

    @GetMapping
    public List<ProductResponse> findAll(@RequestParam(required = false) String search,
                                         @RequestParam(required = false) String category) {
        return products.findPublic(search, category).stream().map(ProductResponse::from).toList();
    }

    @GetMapping("/{slug}")
    public ProductResponse findBySlug(@PathVariable String slug) {
        return ProductResponse.from(products.findPublicBySlug(slug));
    }
}

package com.hida.cohida.product.controller;

import com.hida.cohida.product.dto.ProductResponse;
import com.hida.cohida.product.dto.ProductPageResponse;
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
  public List<ProductResponse> findAll(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Long categoryId) {
    return products.findPublic(search, categoryId).stream()
        .map(ProductResponse::from)
        .toList();
  }

  @GetMapping("/lookup")
  public List<ProductResponse> lookup(@RequestParam List<Long> ids) {
    return products.findPublicByIds(ids);
  }

  @GetMapping("/search")
  public ProductPageResponse search(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Long categoryId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "24") int size) {
    return products.findPublicPage(search, categoryId, page, size);
  }

  @GetMapping("/{slug}")
  public ProductResponse findBySlug(@PathVariable String slug) {
    return ProductResponse.from(products.findPublicBySlug(slug));
  }
}

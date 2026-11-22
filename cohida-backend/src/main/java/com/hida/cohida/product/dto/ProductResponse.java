package com.hida.cohida.product.dto;

import com.hida.cohida.product.domain.Product;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;

public record ProductResponse(
    Long id,
    String code,
    String slug,
    String name,
    String brand,
    String description,
    String imageUrl,
    int minimumStock,
    boolean active,
    double rating,
    int reviewCount,
    Set<Long> categoryIds,
    List<ProductVariantResponse> variants,
    LocalDateTime createdAt) {
  public static ProductResponse from(Product product) {
    var variantsById = new LinkedHashMap<Long, ProductVariantResponse>();
    product
        .getVariants()
        .forEach(
            variant ->
                variantsById.putIfAbsent(
                    variant.getId(), ProductVariantResponse.from(variant)));

    return new ProductResponse(
        product.getId(),
        product.getCode(),
        product.getSlug(),
        product.getName(),
        product.getBrand(),
        product.getDescription(),
        product.getImageUrl(),
        product.getMinimumStock(),
        product.isActive(),
        product.getRating(),
        product.getReviewCount(),
        product.getCategories().stream()
            .map(category -> category.getId())
            .collect(java.util.stream.Collectors.toSet()),
        List.copyOf(variantsById.values()),
        product.getCreatedAt());
  }
}

package com.hida.cohida.product.dto;

import com.hida.cohida.product.domain.Product;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public record ProductResponse(
        Long id,
        String code,
        String slug,
        String name,
        String brand,
        String description,
        int minimumStock,
        boolean active,
        Set<String> categories,
        List<ProductVariantResponse> variants,
        LocalDateTime createdAt
) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(product.getId(), product.getCode(), product.getSlug(), product.getName(),
                product.getBrand(), product.getDescription(), product.getMinimumStock(), product.isActive(),
                Set.copyOf(product.getCategories()), product.getVariants().stream().map(ProductVariantResponse::from).toList(),
                product.getCreatedAt());
    }
}

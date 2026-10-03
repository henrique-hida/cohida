package com.hida.cohida.product.dto;

public record ProductVariantRequest(
        String sku,
        String label,
        String color,
        String size,
        Long priceCents,
        Integer stockQuantity
) {
}

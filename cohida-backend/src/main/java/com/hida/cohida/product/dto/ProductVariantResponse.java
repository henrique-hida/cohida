package com.hida.cohida.product.dto;

import com.hida.cohida.product.domain.ProductVariant;

public record ProductVariantResponse(
        Long id,
        String sku,
        String label,
        String color,
        String size,
        long priceCents,
        int stockQuantity
) {
    public static ProductVariantResponse from(ProductVariant variant) {
        return new ProductVariantResponse(variant.getId(), variant.getSku(), variant.getLabel(), variant.getColor(),
                variant.getSize(), variant.getPriceCents(), variant.getStockQuantity());
    }
}

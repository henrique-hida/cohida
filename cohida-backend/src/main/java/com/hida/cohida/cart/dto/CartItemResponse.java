package com.hida.cohida.cart.dto;

import com.hida.cohida.cart.domain.CartItem;

public record CartItemResponse(Long id, Long variantId, Long productId, String productName, String sku, String label,
                               long unitPriceCents, int quantity, long lineTotalCents, int availableStock) {
    static CartItemResponse from(CartItem item) {
        return new CartItemResponse(item.getId(), item.getVariant().getId(), item.getVariant().getProduct().getId(),
                item.getVariant().getProduct().getName(), item.getVariant().getSku(), item.getVariant().getLabel(),
                item.getVariant().getPriceCents(), item.getQuantity(), item.getVariant().getPriceCents() * item.getQuantity(),
                item.getVariant().getStockQuantity());
    }
}

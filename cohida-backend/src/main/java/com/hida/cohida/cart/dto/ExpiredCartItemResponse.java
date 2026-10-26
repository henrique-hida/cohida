package com.hida.cohida.cart.dto;

import com.hida.cohida.cart.domain.ExpiredCartItem;
import java.time.LocalDateTime;

public record ExpiredCartItemResponse(Long id, Long variantId, Long productId, String productName, String label, int quantity, LocalDateTime expiredAt) {
    public static ExpiredCartItemResponse from(ExpiredCartItem item) {
        return new ExpiredCartItemResponse(item.getId(), item.getVariant().getId(), item.getVariant().getProduct().getId(), item.getVariant().getProduct().getName(), item.getVariant().getLabel(), item.getQuantity(), item.getExpiredAt());
    }
}

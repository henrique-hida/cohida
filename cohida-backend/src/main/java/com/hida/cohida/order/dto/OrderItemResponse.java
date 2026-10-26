package com.hida.cohida.order.dto;

import com.hida.cohida.order.domain.OrderItem;

public record OrderItemResponse(Long id, Long variantId, String productName, String sku, String variantLabel,
                                long unitPriceCents, int quantity) {
    static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(item.getId(), item.getVariantId(), item.getProductName(), item.getSku(), item.getVariantLabel(), item.getUnitPriceCents(), item.getQuantity());
    }
}

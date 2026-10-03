package com.hida.cohida.cart.dto;

import com.hida.cohida.cart.domain.Cart;

import java.util.List;

public record CartResponse(Long id, List<CartItemResponse> items, String couponCode, long subtotalCents,
                           long discountCents, long shippingCents, long totalCents) {
    public static CartResponse from(Cart cart, long discountCents) {
        List<CartItemResponse> items = cart.getItems().stream().map(CartItemResponse::from).toList();
        long subtotal = items.stream().mapToLong(CartItemResponse::lineTotalCents).sum();
        long shipping = 0;
        return new CartResponse(cart.getId(), items, cart.getCoupon() == null ? null : cart.getCoupon().getCode(),
                subtotal, discountCents, shipping, Math.max(0, subtotal - discountCents + shipping));
    }
}

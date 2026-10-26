package com.hida.cohida.cart.dto;

import com.hida.cohida.cart.domain.Cart;

import java.util.List;

public record CartResponse(Long id, List<CartItemResponse> items, String couponCode, List<String> couponCodes, long subtotalCents,
                           long discountCents, long shippingCents, long totalCents) {
    public static CartResponse from(Cart cart, long discountCents) {
        List<CartItemResponse> items = cart.getItems().stream().map(CartItemResponse::from).toList();
        long subtotal = items.stream().mapToLong(CartItemResponse::lineTotalCents).sum();
        long shipping = 0;
        List<String> couponCodes = cart.getCoupons().stream().map(com.hida.cohida.coupon.domain.Coupon::getCode).sorted().toList();
        return new CartResponse(cart.getId(), items, couponCodes.stream().findFirst().orElse(null), couponCodes,
                subtotal, discountCents, shipping, Math.max(0, subtotal - discountCents + shipping));
    }
}

package com.hida.cohida.order.dto;

public record CheckoutRequest(Long deliveryAddressId, Long paymentCardId) {
}

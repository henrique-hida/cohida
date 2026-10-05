package com.hida.cohida.order.dto;

import java.util.List;

public record CheckoutRequest(
        Long deliveryAddressId,
        Long paymentCardId,
        List<PaymentAllocationRequest> payments
) {
}

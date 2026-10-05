package com.hida.cohida.order.dto;

import com.hida.cohida.order.domain.OrderPayment;

public record OrderPaymentResponse(Long paymentCardId, String brand, String lastDigits, long amountCents) {
    public static OrderPaymentResponse from(OrderPayment payment) {
        return new OrderPaymentResponse(
                payment.getPaymentCard().getId(),
                payment.getPaymentCard().getBrand(),
                payment.getPaymentCard().getLastDigits(),
                payment.getAmountCents());
    }
}

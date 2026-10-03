package com.hida.cohida.paymentcard.dto;

import com.hida.cohida.paymentcard.domain.PaymentCard;

public record PaymentCardResponse(
        Long id,
        String brand,
        String lastDigits,
        String label,
        int expiryMonth,
        int expiryYear,
        boolean preferred
) {
    public static PaymentCardResponse from(PaymentCard card) {
        return new PaymentCardResponse(card.getId(), card.getBrand(), card.getLastDigits(), card.getLabel(),
                card.getExpiryMonth(), card.getExpiryYear(), card.isPreferred());
    }
}

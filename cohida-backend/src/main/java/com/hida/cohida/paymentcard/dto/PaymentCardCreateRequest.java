package com.hida.cohida.paymentcard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PaymentCardCreateRequest(
        String processorToken,
        @JsonProperty(access = JsonProperty.Access.WRITE_ONLY) String cardNumber,
        String label,
        Integer expiryMonth,
        Integer expiryYear
) {
}

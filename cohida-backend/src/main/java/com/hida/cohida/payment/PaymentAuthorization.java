package com.hida.cohida.payment;

public record PaymentAuthorization(boolean approved, String reason) {
    public static PaymentAuthorization accepted() {
        return new PaymentAuthorization(true, null);
    }

    public static PaymentAuthorization declined(String reason) {
        return new PaymentAuthorization(false, reason);
    }
}

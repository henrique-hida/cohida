package com.hida.cohida.coupon.exception;

public class CouponNotFoundException extends RuntimeException {
    public CouponNotFoundException(String identifier) {
        super("Cupom não encontrado: " + identifier);
    }
}

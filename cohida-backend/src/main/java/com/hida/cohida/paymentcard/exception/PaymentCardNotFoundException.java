package com.hida.cohida.paymentcard.exception;

public class PaymentCardNotFoundException extends RuntimeException {
    public PaymentCardNotFoundException(Long id) {
        super("Cartão não encontrado: " + id);
    }
}

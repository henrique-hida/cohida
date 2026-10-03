package com.hida.cohida.customer.exception;

public class CustomerNotFoundException extends RuntimeException {
    public CustomerNotFoundException(Long id) {
        super("Cliente não encontrado: " + id);
    }
}

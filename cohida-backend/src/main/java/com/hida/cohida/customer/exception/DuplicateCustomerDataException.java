package com.hida.cohida.customer.exception;

public class DuplicateCustomerDataException extends RuntimeException {
    public DuplicateCustomerDataException(String message) {
        super(message);
    }
}

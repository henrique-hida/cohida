package com.hida.cohida.auth.dto;

import java.time.LocalDate;

public record RegisterRequest(String name, LocalDate birthDate, String cpf, String phone, String email,
                              String password, String passwordConfirmation, AddressRequest billingAddress,
                              AddressRequest deliveryAddress) {
}

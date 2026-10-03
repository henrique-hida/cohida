package com.hida.cohida.customer.dto;

import com.hida.cohida.auth.dto.AddressRequest;

import java.time.LocalDate;

public record CustomerUpdateRequest(
        String name,
        LocalDate birthDate,
        String phone,
        String email,
        AddressRequest billingAddress,
        AddressRequest deliveryAddress
) {
}

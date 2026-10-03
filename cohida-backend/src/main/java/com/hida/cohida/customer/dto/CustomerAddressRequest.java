package com.hida.cohida.customer.dto;

import com.hida.cohida.customer.enums.AddressType;

public record CustomerAddressRequest(
        AddressType type,
        String label,
        String street,
        String number,
        String neighborhood,
        String postalCode,
        String city,
        String state,
        String country
) {
}

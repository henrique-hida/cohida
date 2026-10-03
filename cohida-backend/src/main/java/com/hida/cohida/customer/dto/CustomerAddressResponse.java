package com.hida.cohida.customer.dto;

import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.enums.AddressType;

public record CustomerAddressResponse(
        Long id,
        String label,
        AddressType type,
        String street,
        String number,
        String neighborhood,
        String postalCode,
        String city,
        String state,
        String country
) {
    public static CustomerAddressResponse from(CustomerAddress address) {
        return new CustomerAddressResponse(
                address.getId(),
                address.getLabel(),
                address.getType(),
                address.getStreet(),
                address.getNumber(),
                address.getNeighborhood(),
                address.getZipCode(),
                address.getCity(),
                address.getState(),
                address.getCountry()
        );
    }
}

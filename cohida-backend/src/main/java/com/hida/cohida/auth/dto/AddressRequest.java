package com.hida.cohida.auth.dto;

public record AddressRequest(String label, String street, String number, String neighborhood, String postalCode,
                             String city, String state, String country) {
}

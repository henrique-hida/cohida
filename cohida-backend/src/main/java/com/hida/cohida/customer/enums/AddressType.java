package com.hida.cohida.customer.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum AddressType {
    BILLING,
    DELIVERY;

    @JsonCreator
    public static AddressType from(String value) {
        return AddressType.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}

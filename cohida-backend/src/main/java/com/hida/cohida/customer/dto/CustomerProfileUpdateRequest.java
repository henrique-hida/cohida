package com.hida.cohida.customer.dto;

import java.time.LocalDate;

public record CustomerProfileUpdateRequest(
        String name,
        LocalDate birthDate,
        String phone,
        String email
) {
}

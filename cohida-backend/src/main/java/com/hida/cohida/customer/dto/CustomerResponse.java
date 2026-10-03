package com.hida.cohida.customer.dto;

import com.hida.cohida.customer.domain.Customer;

import java.time.LocalDate;
import java.util.List;

public record CustomerResponse(
        Long id,
        String code,
        String name,
        LocalDate birthDate,
        String cpf,
        String phone,
        String email,
        boolean active,
        List<CustomerAddressResponse> addresses
) {
    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getCode(),
                customer.getName(),
                customer.getBirthDate(),
                customer.getCpf(),
                customer.getPhone(),
                customer.getAccount().getEmail(),
                customer.isActive(),
                customer.getAddresses().stream().map(CustomerAddressResponse::from).toList());
    }
}

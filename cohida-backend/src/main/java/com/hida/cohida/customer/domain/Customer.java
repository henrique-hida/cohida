package com.hida.cohida.customer.domain;

import com.hida.cohida.account.domain.Account;
import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.customer.enums.AddressType;
import com.hida.cohida.customer.exception.CustomerValidationException;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customers")
public class Customer extends DomainEntity {
    @Getter
    @Column(nullable = false, updatable = false, length = 20, unique = true)
    private String code;

    @Getter
    @Column(nullable = false, length = 120)
    private String name;

    @Getter
    @Column(nullable = false)
    private LocalDate birthDate;

    @Getter
    @Column(nullable = false, length = 11, unique = true)
    private String cpf;

    @Getter
    @Column(nullable = false, length = 20)
    private String phone;

    @Getter
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomerAddress> addresses = new ArrayList<>();

    @Getter
    @OneToOne(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, optional = false)
    private Account account;

    protected Customer() {
    }

    public Customer(
            String code,
            String name,
            LocalDate birthDate,
            String cpf,
            String phone
    ) {
        this.code = code;
        this.name = name;
        this.birthDate = birthDate;
        this.cpf = cpf;
        this.phone = phone;
    }

    public void addAddress(CustomerAddress address) {
        address.assignTo(this);
        addresses.add(address);
    }

    public void attachAccount(Account account) {
        account.assignTo(this);
        this.account = account;
    }

    public void normalize() {
        cpf = cpf == null ? null : cpf.replaceAll("\\D", "");
        phone = phone == null ? null : phone.replaceAll("\\D", "");
        if (account != null) {
            account.normalize();
        }
    }

    public void updateProfile(String name, LocalDate birthDate, String phone, String email) {
        this.name = name;
        this.birthDate = birthDate;
        this.phone = phone;
        account.changeEmail(email);
    }

    public void replaceAddresses(CustomerAddress billingAddress, CustomerAddress deliveryAddress) {
        addresses.clear();
        addAddress(billingAddress);
        addAddress(deliveryAddress);
    }

    public CustomerAddress address(Long addressId) {
        return addresses.stream().filter(address -> address.getId().equals(addressId)).findFirst()
                .orElseThrow(() -> new CustomerValidationException("Endereço do cliente não encontrado."));
    }

    public void removeAddress(Long addressId) {
        CustomerAddress address = address(addressId);
        long sameType = addresses.stream().filter(item -> item.getType() == address.getType()).count();
        if (sameType == 1) {
            throw new CustomerValidationException("O cliente deve manter um endereço de cobrança e um de entrega.");
        }
        addresses.remove(address);
    }

    public void ensureRequiredAddressTypes() {
        boolean billing = addresses.stream().anyMatch(address -> address.getType() == AddressType.BILLING);
        boolean delivery = addresses.stream().anyMatch(address -> address.getType() == AddressType.DELIVERY);
        if (!billing || !delivery) {
            throw new CustomerValidationException("O cliente deve manter um endereço de cobrança e um de entrega.");
        }
    }
}

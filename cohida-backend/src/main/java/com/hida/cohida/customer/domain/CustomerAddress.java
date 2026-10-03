package com.hida.cohida.customer.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.customer.dto.CustomerAddressRequest;
import com.hida.cohida.customer.enums.AddressType;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "customer_addresses")
public class CustomerAddress extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Getter
    @Column(nullable = false, length = 80)
    private String label;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AddressType type;

    @Getter
    @Column(nullable = false, length = 160)
    private String street;

    @Getter
    @Column(nullable = false, length = 20)
    private String number;

    @Getter
    @Column(nullable = false, length = 100)
    private String neighborhood;

    @Getter
    @Column(nullable = false, length = 8)
    private String zipCode;

    @Getter
    @Column(nullable = false, length = 100)
    private String city;

    @Getter
    @Column(nullable = false, length = 2)
    private String state;

    @Getter
    @Column(nullable = false, length = 80)
    private String country;

    protected CustomerAddress() {
    }

    public CustomerAddress(
            String label,
            AddressType type,
            String street,
            String number,
            String neighborhood,
            String zipCode,
            String city,
            String state,
            String country
    ) {
        this.label = label;
        this.type = type;
        this.street = street;
        this.number = number;
        this.neighborhood = neighborhood;
        this.zipCode = zipCode;
        this.city = city;
        this.state = state;
        this.country = country;
    }

    void assignTo(Customer customer) {
        this.customer = customer;
    }

    public void update(CustomerAddressRequest request) {
        this.type = request.type();
        this.label = request.label();
        this.street = request.street();
        this.number = request.number();
        this.neighborhood = request.neighborhood();
        this.zipCode = request.postalCode();
        this.city = request.city();
        this.state = request.state();
        this.country = request.country();
    }
}

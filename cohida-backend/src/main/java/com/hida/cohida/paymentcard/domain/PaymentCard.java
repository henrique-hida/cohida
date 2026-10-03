package com.hida.cohida.paymentcard.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.customer.domain.Customer;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "payment_cards")
public class PaymentCard extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "processor_token", nullable = false, unique = true, length = 255)
    private String processorToken;

    @Getter
    @Column(nullable = false, length = 40)
    private String brand;

    @Getter
    @Column(name = "last_digits", nullable = false, length = 4)
    private String lastDigits;

    @Getter
    @Column(nullable = false, length = 120)
    private String label;

    @Getter
    @Column(name = "expiry_month", nullable = false)
    private int expiryMonth;

    @Getter
    @Column(name = "expiry_year", nullable = false)
    private int expiryYear;

    @Getter
    @Column(name = "preferred", nullable = false)
    private boolean preferred;

    protected PaymentCard() {
    }

    public PaymentCard(Customer customer, String processorToken, String brand, String lastDigits,
                       String label, int expiryMonth, int expiryYear, boolean preferred) {
        this.customer = customer;
        this.processorToken = processorToken;
        this.brand = brand;
        this.lastDigits = lastDigits;
        this.label = label;
        this.expiryMonth = expiryMonth;
        this.expiryYear = expiryYear;
        this.preferred = preferred;
    }

    public void updateLabel(String label) {
        this.label = label;
    }

    public void makePreferred() {
        preferred = true;
    }
}

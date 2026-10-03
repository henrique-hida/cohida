package com.hida.cohida.paymentcard.service;

import com.hida.cohida.account.domain.Account;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.enums.AddressType;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.paymentcard.domain.PaymentCard;
import com.hida.cohida.paymentcard.dto.PaymentCardCreateRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class PaymentCardServiceTest {
    @Autowired
    private PaymentCardService paymentCards;

    @Autowired
    private CustomerRepository customers;

    @Test
    void managesCardsAndMaintainsOnePreferredCard() {
        Customer customer = customer();
        customers.save(customer);

        PaymentCard first = paymentCards.create(customer.getId(), request("token-first", "4242 4242 4242 4242", "Pessoal"));
        PaymentCard second = paymentCards.create(customer.getId(), request("token-second", "5555 5555 5555 4444", "Trabalho"));

        assertTrue(first.isPreferred());
        assertFalse(second.isPreferred());
        assertEquals("Visa", first.getBrand());
        assertEquals("4242", first.getLastDigits());
        assertEquals("Mastercard", second.getBrand());
        assertEquals(2, paymentCards.findAll(customer.getId()).size());

        paymentCards.setPreferred(customer.getId(), second.getId());
        assertEquals(second.getId(), paymentCards.findAll(customer.getId()).getFirst().getId());

        paymentCards.delete(customer.getId(), second.getId());
        assertEquals(1, paymentCards.findAll(customer.getId()).size());
        assertTrue(paymentCards.findAll(customer.getId()).getFirst().isPreferred());
    }

    private static PaymentCardCreateRequest request(String token, String cardNumber, String label) {
        return new PaymentCardCreateRequest(token, cardNumber, label, 12, 2030);
    }

    private static Customer customer() {
        Customer customer = new Customer("CU-CARD-TEST", "Cliente de Cartão", java.time.LocalDate.of(1990, 1, 1),
                "52998224725", "11999999999");
        customer.attachAccount(new Account("card-test@example.com", "not-used-in-this-test"));
        customer.addAddress(address(AddressType.BILLING));
        customer.addAddress(address(AddressType.DELIVERY));
        return customer;
    }

    private static CustomerAddress address(AddressType type) {
        return new CustomerAddress("Principal", type, "Rua A", "1", "Centro", "01001000", "São Paulo", "SP", "Brasil");
    }
}

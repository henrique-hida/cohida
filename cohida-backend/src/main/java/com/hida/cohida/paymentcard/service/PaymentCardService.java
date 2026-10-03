package com.hida.cohida.paymentcard.service;

import com.hida.cohida.auth.exception.ConflictException;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.exception.CustomerNotFoundException;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.paymentcard.domain.PaymentCard;
import com.hida.cohida.paymentcard.dto.PaymentCardCreateRequest;
import com.hida.cohida.paymentcard.dto.PaymentCardUpdateRequest;
import com.hida.cohida.paymentcard.exception.PaymentCardNotFoundException;
import com.hida.cohida.paymentcard.repository.PaymentCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PaymentCardService {
    private final PaymentCardRepository cards;
    private final CustomerRepository customers;

    public PaymentCardService(PaymentCardRepository cards, CustomerRepository customers) {
        this.cards = cards;
        this.customers = customers;
    }

    @Transactional(readOnly = true)
    public List<PaymentCard> findAll(Long customerId) {
        return cards.findByCustomerIdAndDeletedAtIsNullOrderByPreferredDescCreatedAtAsc(customerId);
    }

    @Transactional
    public PaymentCard create(Long customerId, PaymentCardCreateRequest request) {
        validateCreate(request);
        if (cards.existsByProcessorToken(request.processorToken().trim())) {
            throw new ConflictException("Este cartão já está cadastrado.");
        }
        Customer customer = activeCustomer(customerId);
        boolean preferred = findAll(customerId).isEmpty();
        CardBrandDetector.CardDetails cardDetails = CardBrandDetector.detect(request.cardNumber());
        PaymentCard card = new PaymentCard(customer, request.processorToken().trim(), cardDetails.brand(),
                cardDetails.lastDigits(), request.label().trim(), request.expiryMonth(), request.expiryYear(), preferred);
        return cards.save(card);
    }

    @Transactional
    public PaymentCard update(Long customerId, Long cardId, PaymentCardUpdateRequest request) {
        if (request == null || isBlank(request.label())) {
            throw new InvalidRequestException("Informe o nome do cartão.");
        }
        PaymentCard card = cardForCustomer(customerId, cardId);
        card.updateLabel(request.label().trim());
        return cards.save(card);
    }

    @Transactional
    public PaymentCard setPreferred(Long customerId, Long cardId) {
        PaymentCard card = cardForCustomer(customerId, cardId);
        cards.clearPreferredForCustomer(customerId);
        card.makePreferred();
        return cards.save(card);
    }

    @Transactional
    public void delete(Long customerId, Long cardId) {
        PaymentCard card = cardForCustomer(customerId, cardId);
        boolean wasPreferred = card.isPreferred();
        card.deactivate();
        cards.save(card);
        if (wasPreferred) {
            findAll(customerId).stream().findFirst().ifPresent(next -> {
                next.makePreferred();
                cards.save(next);
            });
        }
    }

    private Customer activeCustomer(Long customerId) {
        Customer customer = customers.findById(customerId).orElseThrow(() -> new CustomerNotFoundException(customerId));
        if (!customer.isActive()) {
            throw new InvalidRequestException("A conta do cliente está desativada.");
        }
        return customer;
    }

    private PaymentCard cardForCustomer(Long customerId, Long cardId) {
        return cards.findByIdAndCustomerIdAndDeletedAtIsNull(cardId, customerId)
                .orElseThrow(() -> new PaymentCardNotFoundException(cardId));
    }

    private static void validateCreate(PaymentCardCreateRequest request) {
        if (request == null || isBlank(request.processorToken()) || isBlank(request.cardNumber()) || isBlank(request.label())
                || request.expiryMonth() == null || request.expiryMonth() < 1 || request.expiryMonth() > 12
                || request.expiryYear() == null || request.expiryYear() < 2000 || request.expiryYear() > 2200) {
            throw new InvalidRequestException("Os dados seguros do cartão são inválidos.");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

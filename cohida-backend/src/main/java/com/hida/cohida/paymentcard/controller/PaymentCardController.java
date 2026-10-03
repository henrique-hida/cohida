package com.hida.cohida.paymentcard.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.paymentcard.dto.PaymentCardCreateRequest;
import com.hida.cohida.paymentcard.dto.PaymentCardResponse;
import com.hida.cohida.paymentcard.dto.PaymentCardUpdateRequest;
import com.hida.cohida.paymentcard.service.PaymentCardService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/me/cards")
@PreAuthorize("hasRole('CUSTOMER')")
public class PaymentCardController {
    private final PaymentCardService paymentCards;

    public PaymentCardController(PaymentCardService paymentCards) {
        this.paymentCards = paymentCards;
    }

    @GetMapping
    public List<PaymentCardResponse> findAll(@AuthenticationPrincipal AuthenticatedCustomer principal) {
        return paymentCards.findAll(principal.customerId()).stream().map(PaymentCardResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentCardResponse create(@AuthenticationPrincipal AuthenticatedCustomer principal,
                                      @RequestBody PaymentCardCreateRequest request) {
        return PaymentCardResponse.from(paymentCards.create(principal.customerId(), request));
    }

    @PutMapping("/{cardId}")
    public PaymentCardResponse update(@AuthenticationPrincipal AuthenticatedCustomer principal,
                                      @PathVariable Long cardId, @RequestBody PaymentCardUpdateRequest request) {
        return PaymentCardResponse.from(paymentCards.update(principal.customerId(), cardId, request));
    }

    @PatchMapping("/{cardId}/preferred")
    public PaymentCardResponse setPreferred(@AuthenticationPrincipal AuthenticatedCustomer principal,
                                            @PathVariable Long cardId) {
        return PaymentCardResponse.from(paymentCards.setPreferred(principal.customerId(), cardId));
    }

    @DeleteMapping("/{cardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedCustomer principal, @PathVariable Long cardId) {
        paymentCards.delete(principal.customerId(), cardId);
    }
}

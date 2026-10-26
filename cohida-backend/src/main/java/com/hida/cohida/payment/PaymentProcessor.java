package com.hida.cohida.payment;

import com.hida.cohida.paymentcard.domain.PaymentCard;

import java.util.List;

/**
 * Gateway boundary for card authorization. Replace the simulated implementation
 * with a provider adapter without changing checkout or order-domain code.
 */
public interface PaymentProcessor {
    PaymentAuthorization authorize(List<PaymentCard> cards, long amountCents);
}

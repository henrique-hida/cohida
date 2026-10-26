package com.hida.cohida.payment;

import com.hida.cohida.paymentcard.domain.PaymentCard;
import org.springframework.stereotype.Component;

import java.util.List;

/** Development-only processor. Tokens starting with {@code declined} are rejected. */
@Component
public class SimulatedPaymentProcessor implements PaymentProcessor {
    @Override
    public PaymentAuthorization authorize(List<PaymentCard> cards, long amountCents) {
        boolean declined = cards.stream()
                .map(PaymentCard::getProcessorToken)
                .anyMatch(token -> token.startsWith("declined"));
        return declined
                ? PaymentAuthorization.declined("Cartão recusado pela operadora simulada.")
                : PaymentAuthorization.accepted();
    }
}

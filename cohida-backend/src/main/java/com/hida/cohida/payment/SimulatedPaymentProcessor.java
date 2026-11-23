package com.hida.cohida.payment;

import com.hida.cohida.paymentcard.domain.PaymentCard;
import org.springframework.stereotype.Component;

import java.util.List;

/** Local simulator; token prefixes support deterministic test scenarios. */
@Component
public class SimulatedPaymentProcessor implements PaymentProcessor {
  @Override
  public PaymentAuthorization authorize(
      List<PaymentCard> cards, long amountCents) {
    boolean unavailable = cards.stream()
        .map(PaymentCard::getProcessorToken)
        .anyMatch(token -> token.startsWith("unavailable-"));
    if (unavailable)
      throw new IllegalStateException("Pagamento simulado indisponível.");
    boolean declined =
        cards.stream()
            .map(PaymentCard::getProcessorToken)
            .anyMatch(token -> token.startsWith("declined"));
    return declined
        ? PaymentAuthorization.declined(
            "Cartão recusado pela operadora simulada.")
        : PaymentAuthorization.accepted();
  }
}

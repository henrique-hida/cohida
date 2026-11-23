package com.hida.cohida.payment;

import com.hida.cohida.paymentcard.domain.PaymentCard;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SimulatedPaymentProcessorTest {
  private final SimulatedPaymentProcessor processor =
      new SimulatedPaymentProcessor();

  @Test
  void approvedAndDeclinedCardsProducePredictableResults() {
    assertTrue(processor.authorize(List.of(card("demo-1")), 1000).approved());
    assertFalse(processor.authorize(
        List.of(card("demo-1"), card("declined-1")), 1000).approved());
  }

  @Test
  void unavailableProcessorFailsWithoutClaimingApproval() {
    assertThrows(IllegalStateException.class,
        () -> processor.authorize(List.of(card("unavailable-1")), 1000));
  }

  private PaymentCard card(String token) {
    var card = mock(PaymentCard.class);
    when(card.getProcessorToken()).thenReturn(token);
    return card;
  }
}

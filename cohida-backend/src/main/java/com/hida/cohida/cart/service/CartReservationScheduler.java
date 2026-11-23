package com.hida.cohida.cart.service;

import com.hida.cohida.cart.repository.CartRepository;
import java.time.LocalDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class CartReservationScheduler {
  private static final Logger LOG =
      LoggerFactory.getLogger(CartReservationScheduler.class);
  private static final int BATCH_SIZE = 100;
  private final CartRepository carts;
  private final CartReservationService reservations;
  private long afterCustomerId;

  public CartReservationScheduler(
      CartRepository carts, CartReservationService reservations) {
    this.carts = carts;
    this.reservations = reservations;
  }

  @Scheduled(fixedDelayString = "${cohida.cart.reservation-check-ms:60000}")
  public void processReservations() {
    LocalDateTime now = LocalDateTime.now();
    var customers = carts.findCustomersWithDueReservations(now,
        now.plusMinutes(5), afterCustomerId, PageRequest.of(0, BATCH_SIZE));
    if (customers.isEmpty() && afterCustomerId != 0) {
      afterCustomerId = 0;
      customers = carts.findCustomersWithDueReservations(now,
          now.plusMinutes(5), afterCustomerId, PageRequest.of(0, BATCH_SIZE));
    }
    for (Long customerId : customers) {
      try {
        reservations.processDue(customerId, now);
      } catch (RuntimeException error) {
        LOG.warn("Falha ao processar reservas do cliente {}: {}", customerId,
            error.getClass().getSimpleName());
      }
    }
    afterCustomerId = customers.size() < BATCH_SIZE ? 0 : customers.getLast();
  }
}

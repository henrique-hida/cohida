package com.hida.cohida.cart.service;

import com.hida.cohida.cart.repository.CartRepository;
import java.util.List;
import java.util.stream.LongStream;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CartReservationSchedulerTest {
  @Test
  void continuesToNextBatchEvenIfOneCustomerFails() {
    var carts = mock(CartRepository.class);
    var reservations = mock(CartReservationService.class);
    List<Long> first = LongStream.rangeClosed(1, 100).boxed().toList();
    when(carts.findCustomersWithDueReservations(
        any(), any(), eq(0L), any())).thenReturn(first);
    when(carts.findCustomersWithDueReservations(
        any(), any(), eq(100L), any())).thenReturn(List.of(101L));
    doThrow(new IllegalStateException("teste"))
        .when(reservations).processDue(eq(1L), any());

    var scheduler = new CartReservationScheduler(carts, reservations);
    scheduler.processReservations();
    scheduler.processReservations();

    verify(reservations).processDue(eq(2L), any());
    verify(reservations).processDue(eq(101L), any());
  }
}

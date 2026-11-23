package com.hida.cohida.order.repository;

import com.hida.cohida.order.domain.CheckoutIdempotency;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckoutIdempotencyRepository
    extends JpaRepository<CheckoutIdempotency, Long> {
  Optional<CheckoutIdempotency> findByCustomerIdAndKey(
      Long customerId, String key);
}

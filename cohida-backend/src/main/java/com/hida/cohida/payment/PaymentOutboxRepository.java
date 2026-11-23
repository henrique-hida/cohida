package com.hida.cohida.payment;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentOutboxRepository
    extends JpaRepository<PaymentOutboxEvent, String> {
  Optional<PaymentOutboxEvent> findByOrderId(Long orderId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select e from PaymentOutboxEvent e where e.eventId = :id")
  Optional<PaymentOutboxEvent> findForUpdate(@Param("id") String id);

  @Query(value = "select * from payment_outbox "
      + "where processed_at is null and failed_at is null "
      + "and (next_attempt_at is null or next_attempt_at <= :now) "
      + "and (published_at is null or published_at <= :before) "
      + "order by created_at limit :limit for update skip locked",
      nativeQuery = true)
  List<PaymentOutboxEvent> findReadyForPublication(
      @Param("now") LocalDateTime now,
      @Param("before") LocalDateTime before,
      @Param("limit") int limit);
}

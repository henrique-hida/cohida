package com.hida.cohida.payment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_outbox")
public class PaymentOutboxEvent {
  @Id
  @Column(name = "event_id", length = 36)
  private String eventId;

  @Column(name = "order_id", nullable = false, unique = true)
  private Long orderId;

  @Column(name = "event_type", nullable = false, length = 40)
  private String eventType;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  @Column(name = "published_at")
  private LocalDateTime publishedAt;

  @Column(name = "processed_at")
  private LocalDateTime processedAt;

  @Column(name = "failed_at")
  private LocalDateTime failedAt;

  @Column(name = "next_attempt_at")
  private LocalDateTime nextAttemptAt;

  @Column(nullable = false)
  private int attempts;

  @Column(name = "last_error", length = 120)
  private String lastError;

  protected PaymentOutboxEvent() {}

  public PaymentOutboxEvent(Long orderId, boolean approved) {
    this.eventId = UUID.randomUUID().toString();
    this.orderId = orderId;
    this.eventType = approved ? "PAYMENT_APPROVED" : "PAYMENT_DECLINED";
    this.createdAt = LocalDateTime.now();
  }

  public String getEventType() {
    return eventType;
  }

  public String getEventId() {
    return eventId;
  }

  public Long getOrderId() {
    return orderId;
  }

  public boolean isComplete() {
    return processedAt != null || failedAt != null;
  }

  public boolean isReady(LocalDateTime now) {
    return nextAttemptAt == null || !nextAttemptAt.isAfter(now);
  }

  public void published(LocalDateTime now) {
    publishedAt = now;
  }

  public void processed(LocalDateTime now) {
    processedAt = now;
    lastError = null;
  }

  public void failed(LocalDateTime now, String error) {
    attempts++;
    lastError = error.substring(0, Math.min(error.length(), 120));
    publishedAt = null;
    if (attempts >= 5) {
      failedAt = now;
      nextAttemptAt = null;
    } else {
      long seconds = (1L << attempts) * 5
          + java.util.concurrent.ThreadLocalRandom.current().nextLong(6);
      nextAttemptAt = now.plusSeconds(seconds);
    }
  }
}

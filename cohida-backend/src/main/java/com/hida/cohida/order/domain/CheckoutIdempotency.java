package com.hida.cohida.order.domain;

import com.hida.cohida.customer.domain.Customer;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "checkout_idempotency",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"customer_id", "idempotency_key"}))
public class CheckoutIdempotency {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "customer_id", nullable = false)
  private Customer customer;

  @Column(name = "idempotency_key", nullable = false, length = 64)
  private String key;

  @Column(name = "request_hash", nullable = false, length = 64)
  private String requestHash;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private SaleOrder order;

  @Column(name = "response_json", nullable = false, columnDefinition = "text")
  private String responseJson;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;

  protected CheckoutIdempotency() {}

  public CheckoutIdempotency(
      Customer customer, String key, String requestHash, SaleOrder order,
      String responseJson) {
    this.customer = customer;
    this.key = key;
    this.requestHash = requestHash;
    this.order = order;
    this.responseJson = responseJson;
    this.createdAt = LocalDateTime.now();
  }

  public String getRequestHash() {
    return requestHash;
  }

  public String getResponseJson() {
    return responseJson;
  }
}

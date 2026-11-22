package com.hida.cohida.product.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.order.domain.SaleOrder;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;

@Entity
@Table(
    name = "product_reviews",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uk_product_reviews_customer_product",
            columnNames = {"customer_id", "product_id"}))
public class ProductReview extends DomainEntity {
  @Getter
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @Getter
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id")
  private Customer customer;

  @Getter
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "order_id")
  private SaleOrder order;

  @Getter
  @Column(nullable = false, precision = 2, scale = 1)
  private BigDecimal rating;

  @Getter
  @Column(nullable = false, length = 1000)
  private String description;

  @Getter
  @Column(name = "verified_purchase", nullable = false)
  private boolean verifiedPurchase;

  protected ProductReview() {}

  public ProductReview(
      Product product,
      Customer customer,
      SaleOrder order,
      BigDecimal rating,
      String description) {
    this.product = product;
    this.customer = customer;
    this.order = order;
    this.rating = rating;
    this.description = description;
    this.verifiedPurchase = customer != null && order != null;
  }
}

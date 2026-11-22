package com.hida.cohida.product.dto;

import com.hida.cohida.product.domain.ProductReview;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductReviewResponse(
    Long id,
    String reviewer,
    boolean verifiedPurchase,
    BigDecimal rating,
    String description,
    LocalDateTime createdAt) {
  public static ProductReviewResponse from(ProductReview review) {
    return new ProductReviewResponse(
        review.getId(),
        review.isVerifiedPurchase() ? "Cliente verificado" : "Cliente",
        review.isVerifiedPurchase(),
        review.getRating(),
        review.getDescription(),
        review.getCreatedAt());
  }
}

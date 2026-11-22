package com.hida.cohida.product.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.product.dto.ProductReviewRequest;
import com.hida.cohida.product.dto.ProductReviewResponse;
import com.hida.cohida.product.dto.ReviewEligibilityResponse;
import com.hida.cohida.product.service.ProductReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProductReviewController {
  private final ProductReviewService reviews;

  public ProductReviewController(ProductReviewService reviews) {
    this.reviews = reviews;
  }

  @GetMapping("/products/{slug}/reviews")
  public List<ProductReviewResponse> publicReviews(@PathVariable String slug) {
    return reviews.publicReviews(slug).stream()
        .map(ProductReviewResponse::from)
        .toList();
  }

  @GetMapping("/customers/me/products/{productId}/review-eligibility")
  @PreAuthorize("hasRole('CUSTOMER')")
  public ReviewEligibilityResponse eligibility(
      @AuthenticationPrincipal AuthenticatedCustomer principal,
      @PathVariable Long productId,
      @RequestParam(required = false) Long orderId) {
    return reviews.eligibility(principal.customerId(), productId, orderId);
  }

  @PostMapping("/customers/me/products/{productId}/reviews")
  @PreAuthorize("hasRole('CUSTOMER')")
  @ResponseStatus(HttpStatus.CREATED)
  public ProductReviewResponse create(
      @AuthenticationPrincipal AuthenticatedCustomer principal,
      @PathVariable Long productId,
      @RequestBody ProductReviewRequest request) {
    return ProductReviewResponse.from(
        reviews.create(principal.customerId(), productId, request));
  }
}

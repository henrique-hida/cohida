package com.hida.cohida.product.repository;

import com.hida.cohida.product.domain.ProductReview;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductReviewRepository
    extends JpaRepository<ProductReview, Long> {
  @EntityGraph(attributePaths = "customer")
  List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);

  boolean existsByCustomerIdAndProductId(Long customerId, Long productId);

  boolean existsByProductId(Long productId);
}

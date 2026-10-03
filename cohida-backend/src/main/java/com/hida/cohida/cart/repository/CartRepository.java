package com.hida.cohida.cart.repository;

import com.hida.cohida.cart.domain.Cart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    @EntityGraph(attributePaths = {"items", "items.variant", "items.variant.product", "coupon"})
    Optional<Cart> findByCustomerId(Long customerId);
}

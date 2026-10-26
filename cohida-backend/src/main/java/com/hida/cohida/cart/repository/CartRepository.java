package com.hida.cohida.cart.repository;

import com.hida.cohida.cart.domain.Cart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.time.LocalDateTime;

public interface CartRepository extends JpaRepository<Cart, Long> {
    @EntityGraph(attributePaths = {"items", "items.variant", "items.variant.product", "coupons"})
    Optional<Cart> findByCustomerId(Long customerId);

    @org.springframework.data.jpa.repository.Query("select coalesce(sum(item.quantity), 0) from CartItem item where item.variant.id = :variantId and item.cart.id <> :cartId and item.reservedUntil > :now")
    long activeReservationQuantity(Long variantId, Long cartId, LocalDateTime now);
}

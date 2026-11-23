package com.hida.cohida.cart.repository;

import com.hida.cohida.cart.domain.Cart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

public interface CartRepository extends JpaRepository<Cart, Long> {
  @EntityGraph(
      attributePaths = {
        "items",
        "items.variant",
        "items.variant.product",
        "coupons"
      })
  Optional<Cart> findByCustomerId(Long customerId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select cart from Cart cart where cart.customer.id = :customerId")
  Optional<Cart> findForUpdateByCustomerId(Long customerId);

  @Transactional(readOnly = true)
  @Query("select cart.customer.id from Cart cart "
      + "where cart.customer.id > :after "
      + "order by cart.customer.id")
  List<Long> findCustomerIdsAfter(Long after, Pageable page);

  @Transactional(readOnly = true)
  @Query("select distinct cart.customer.id from Cart cart join cart.items item "
      + "where cart.customer.id > :after and item.reservedUntil <= :warningAt "
      + "and (item.reservedUntil <= :now or item.expiryWarningSent = false) "
      + "order by cart.customer.id")
  List<Long> findCustomersWithDueReservations(
      LocalDateTime now, LocalDateTime warningAt, Long after, Pageable page);

  @org.springframework.data.jpa.repository.Query(
      "select coalesce(sum(item.quantity), 0) from "
          + "CartItem item where item.variant.id = :variantId"
          + " and item.cart.id <> :cartId and item.reservedUntil > :now")
  long activeReservationQuantity(
      Long variantId, Long cartId, LocalDateTime now);
}

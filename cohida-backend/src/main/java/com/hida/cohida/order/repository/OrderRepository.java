package com.hida.cohida.order.repository;

import com.hida.cohida.order.domain.SaleOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<SaleOrder, Long> {
    @EntityGraph(attributePaths = {"items", "payments.paymentCard", "issuedCoupon"})
    List<SaleOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = {"items", "payments.paymentCard", "issuedCoupon"})
    Optional<SaleOrder> findByIdAndCustomerId(Long id, Long customerId);

    @EntityGraph(attributePaths = {"items", "payments.paymentCard", "issuedCoupon"})
    List<SaleOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"items", "payments.paymentCard", "issuedCoupon"})
    Optional<SaleOrder> findById(Long id);

    @Modifying
    @Query("update SaleOrder order set order.createdAt = :createdAt where order.id = :id")
    void updateCreatedAt(@Param("id") Long id, @Param("createdAt") LocalDateTime createdAt);
}

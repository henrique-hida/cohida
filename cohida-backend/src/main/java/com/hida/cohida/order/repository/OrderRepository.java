package com.hida.cohida.order.repository;

import com.hida.cohida.order.domain.SaleOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<SaleOrder, Long> {
    @EntityGraph(attributePaths = "items")
    List<SaleOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @EntityGraph(attributePaths = "items")
    Optional<SaleOrder> findByIdAndCustomerId(Long id, Long customerId);

    @EntityGraph(attributePaths = "items")
    List<SaleOrder> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "items")
    Optional<SaleOrder> findById(Long id);
}

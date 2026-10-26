package com.hida.cohida.returnrequest.repository;

import com.hida.cohida.returnrequest.domain.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    boolean existsByOrderItemId(Long id);
    boolean existsByOrderId(Long id);

    List<ReturnRequest> findAllByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("select r from ReturnRequest r where r.order.customer.id = :customerId or r.orderItem.order.customer.id = :customerId order by r.createdAt desc")
    List<ReturnRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<ReturnRequest> findById(Long id);
}

package com.hida.cohida.returnrequest.repository;

import com.hida.cohida.returnrequest.domain.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {
    boolean existsByOrderItemId(Long id);

    List<ReturnRequest> findAllByOrderByCreatedAtDesc();

    List<ReturnRequest> findByOrderItemOrderCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<ReturnRequest> findById(Long id);
}

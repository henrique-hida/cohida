package com.hida.cohida.returnrequest.repository;

import com.hida.cohida.returnrequest.domain.ReturnRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface ReturnRequestRepository
    extends JpaRepository<ReturnRequest, Long> {
  boolean existsByOrderItemId(Long id);

  boolean existsByOrderId(Long id);

  boolean existsByOrderIdAndOrderItemIsNull(Long id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select r from ReturnRequest r where r.id = :id")
  Optional<ReturnRequest> findForUpdate(@Param("id") Long id);

  List<ReturnRequest> findAllByOrderByCreatedAtDesc();

  @Query("select r from ReturnRequest r "
      + "left join r.order directOrder "
      + "left join r.orderItem item "
      + "left join item.order itemOrder "
      + "where directOrder.customer.id = :customerId "
      + "or itemOrder.customer.id = :customerId order by r.createdAt desc")
  List<ReturnRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

  Optional<ReturnRequest> findById(Long id);
}

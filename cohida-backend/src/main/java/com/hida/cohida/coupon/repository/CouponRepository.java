package com.hida.cohida.coupon.repository;

import com.hida.cohida.coupon.domain.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findAllByOrderByCreatedAtDesc();

    @Query("""
            select coupon from Coupon coupon
            where coupon.active = true
              and (coupon.assignedCustomer is null or coupon.assignedCustomer.id = :customerId)
            order by coupon.createdAt desc
            """)
    List<Coupon> findAvailableToCustomer(@Param("customerId") Long customerId);

    Optional<Coupon> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    List<Coupon> findByCodeStartingWith(String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Coupon> findWithLockById(Long id);
}

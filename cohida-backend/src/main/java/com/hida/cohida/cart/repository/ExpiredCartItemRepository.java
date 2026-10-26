package com.hida.cohida.cart.repository;
import com.hida.cohida.cart.domain.ExpiredCartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ExpiredCartItemRepository extends JpaRepository<ExpiredCartItem, Long> {
    List<ExpiredCartItem> findByCustomerIdAndAcknowledgedAtIsNullOrderByExpiredAtDesc(Long customerId);
}

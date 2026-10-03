package com.hida.cohida.paymentcard.repository;

import com.hida.cohida.paymentcard.domain.PaymentCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentCardRepository extends JpaRepository<PaymentCard, Long> {
    List<PaymentCard> findByCustomerIdAndDeletedAtIsNullOrderByPreferredDescCreatedAtAsc(Long customerId);

    Optional<PaymentCard> findByIdAndCustomerIdAndDeletedAtIsNull(Long id, Long customerId);

    boolean existsByProcessorToken(String processorToken);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update PaymentCard card
            set card.preferred = false
            where card.customer.id = :customerId and card.deletedAt is null
            """)
    void clearPreferredForCustomer(@Param("customerId") Long customerId);
}

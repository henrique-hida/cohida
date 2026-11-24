package com.hida.cohida.chat.repository;

import com.hida.cohida.chat.domain.ChatResponseRecord;


import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatResponseRepository
    extends JpaRepository<ChatResponseRecord, Long> {
  List<ChatResponseRecord> findTop50ByCustomerIdOrderByIdDesc(long customerId);

  Optional<ChatResponseRecord> findByIdAndCustomerId(long id, long customerId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("delete from ChatResponseRecord r where r.customerId = :id")
  void deleteByCustomer(@Param("id") long customerId);
}

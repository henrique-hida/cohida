package com.hida.cohida.chat.repository;

import com.hida.cohida.chat.domain.ChatState;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatStateRepository extends JpaRepository<ChatState, Long> {
  @Modifying(flushAutomatically = true)
  @Query(value = "insert into chat_state (customer_id) values (:customerId) "
      + "on conflict (customer_id) do nothing", nativeQuery = true)
  void ensureExists(@Param("customerId") long customerId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select state from ChatState state where state.customerId = :id")
  Optional<ChatState> lockByCustomerId(@Param("id") long customerId);
}

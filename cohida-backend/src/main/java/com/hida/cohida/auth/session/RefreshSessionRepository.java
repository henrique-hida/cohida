package com.hida.cohida.auth.session;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshSessionRepository
    extends JpaRepository<RefreshSession, String> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select s from RefreshSession s where s.id = :id")
  Optional<RefreshSession> lock(@Param("id") String id);
}

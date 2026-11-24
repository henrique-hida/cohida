package com.hida.cohida.auth.session;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshSessionRepository
    extends JpaRepository<RefreshSession, String> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select s from RefreshSession s where s.id = :id")
  Optional<RefreshSession> lock(@Param("id") String id);

  @Modifying
  @Query("update RefreshSession s set s.revokedAt = :now "
      + "where s.account.id = :accountId and s.revokedAt is null")
  int revokeAccount(@Param("accountId") Long accountId,
      @Param("now") java.time.LocalDateTime now);

  @Modifying
  @Query(value = """
      delete from auth_sessions where id in (
        select id from auth_sessions
        where expires_at < :cutoff or revoked_at < :cutoff
        order by expires_at limit 500 for update skip locked)
      """, nativeQuery = true)
  int deleteExpiredBatch(@Param("cutoff") java.time.LocalDateTime cutoff);
}

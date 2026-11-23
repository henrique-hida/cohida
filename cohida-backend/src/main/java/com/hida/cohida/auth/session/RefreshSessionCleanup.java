package com.hida.cohida.auth.session;

import java.time.LocalDateTime;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RefreshSessionCleanup {
  private final JdbcTemplate jdbc;

  public RefreshSessionCleanup(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Scheduled(initialDelayString = "${cohida.auth.cleanup-delay-ms:3600000}",
      fixedDelayString = "${cohida.auth.cleanup-interval-ms:86400000}")
  @Transactional
  public void clean() {
    LocalDateTime cutoff =
        LocalDateTime.now(java.time.ZoneOffset.UTC).minusDays(30);
    jdbc.update("""
        delete from auth_sessions where id in (
          select id from auth_sessions
          where expires_at < ? or revoked_at < ?
          order by expires_at limit 500 for update skip locked)
        """, cutoff, cutoff);
  }
}

package com.hida.cohida.auth.session;

import java.time.LocalDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RefreshSessionCleanup {
  private final RefreshSessionRepository sessions;

  public RefreshSessionCleanup(RefreshSessionRepository sessions) {
    this.sessions = sessions;
  }

  @Scheduled(initialDelayString = "${cohida.auth.cleanup-delay-ms:3600000}",
      fixedDelayString = "${cohida.auth.cleanup-interval-ms:86400000}")
  @Transactional
  public void clean() {
    LocalDateTime cutoff =
        LocalDateTime.now(java.time.ZoneOffset.UTC).minusDays(30);
    sessions.deleteExpiredBatch(cutoff);
  }
}

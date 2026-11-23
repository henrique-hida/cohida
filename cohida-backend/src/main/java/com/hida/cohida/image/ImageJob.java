package com.hida.cohida.image;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_image_jobs")
public class ImageJob {
  @Id
  @Column(length = 36)
  private String id;
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
  @Column(name = "published_at")
  private LocalDateTime publishedAt;
  @Column(name = "processed_at")
  private LocalDateTime processedAt;
  @Column(name = "failed_at")
  private LocalDateTime failedAt;
  @Column(name = "next_attempt_at")
  private LocalDateTime nextAttemptAt;
  @Column(name = "claim_token", length = 36)
  private String claimToken;
  @Column(name = "claimed_until")
  private LocalDateTime claimedUntil;
  @Column(nullable = false)
  private int attempts;
  @Column(name = "last_error", length = 120)
  private String lastError;

  protected ImageJob() {}

  public ImageJob(String id) {
    this.id = id;
    this.createdAt = LocalDateTime.now();
  }

  public String id() { return id; }
  public boolean complete() { return processedAt != null || failedAt != null; }
  public String status() {
    if (processedAt != null) return "READY";
    if (failedAt != null) return "FAILED";
    return "PROCESSING";
  }
  public void published(LocalDateTime now) { publishedAt = now; }
  public String claim(LocalDateTime now) {
    if (complete() || (nextAttemptAt != null && nextAttemptAt.isAfter(now))
        || (claimedUntil != null && claimedUntil.isAfter(now))) return null;
    claimToken = UUID.randomUUID().toString();
    claimedUntil = now.plusMinutes(2);
    return claimToken;
  }
  public boolean matches(String token) {
    return !complete() && token != null && token.equals(claimToken);
  }
  public void processed(LocalDateTime now) {
    processedAt = now;
    claimToken = null;
    claimedUntil = null;
    lastError = null;
  }
  public void retry() {
    if (failedAt == null) {
      throw new IllegalStateException(
          "A imagem não precisa de nova tentativa.");
    }
    failedAt = null;
    attempts = 0;
    publishedAt = null;
    nextAttemptAt = null;
    lastError = null;
  }
  public void failed(LocalDateTime now, String error, boolean permanent) {
    attempts++;
    lastError = error.substring(0, Math.min(error.length(), 120));
    publishedAt = null;
    claimToken = null;
    claimedUntil = null;
    if (permanent || attempts >= 5) {
      failedAt = now;
      nextAttemptAt = null;
    } else {
      long jitter =
          java.util.concurrent.ThreadLocalRandom.current().nextLong(6);
      nextAttemptAt = now.plusSeconds((1L << attempts) * 5 + jitter);
    }
  }
}

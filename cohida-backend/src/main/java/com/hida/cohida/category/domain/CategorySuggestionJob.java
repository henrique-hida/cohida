package com.hida.cohida.category.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "category_suggestion_jobs")
public class CategorySuggestionJob {
  @Id private Long categoryId;
  @Column(nullable = false, length = 20)
  private String status;
  private int attempts;
  private UUID token;
  private OffsetDateTime startedAt;
  private OffsetDateTime updatedAt;

  protected CategorySuggestionJob() {}

  public CategorySuggestionJob(long categoryId) {
    this.categoryId = categoryId;
    this.status = "PENDING";
    this.updatedAt = OffsetDateTime.now();
  }

  public String status() { return status; }

  public long categoryId() { return categoryId; }

  public void start(UUID claimToken) {
    status = "PROCESSING";
    attempts++;
    token = claimToken;
    startedAt = OffsetDateTime.now();
    updatedAt = startedAt;
  }

  public void edited() {
    status = "EDITED";
    token = null;
    updatedAt = OffsetDateTime.now();
  }

  public boolean retry() {
    if (!status.equals("FAILED")) return false;
    status = "PENDING";
    attempts = 0;
    token = null;
    updatedAt = OffsetDateTime.now();
    return true;
  }

  public void refreshPending() {
    if (status.equals("PENDING") || status.equals("PROCESSING")) {
      status = "PENDING";
      token = null;
      updatedAt = OffsetDateTime.now();
    }
  }
}

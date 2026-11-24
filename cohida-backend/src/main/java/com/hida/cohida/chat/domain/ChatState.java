package com.hida.cohida.chat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_state")
public class ChatState {
  @Id
  @Column(name = "customer_id")
  private Long customerId;

  @Column(nullable = false)
  private long historyRevision;

  @Column(nullable = false)
  private long suggestionRevision;

  protected ChatState() {}

  public long historyRevision() { return historyRevision; }

  public long suggestionRevision() { return suggestionRevision; }

  public void invalidateHistory() { historyRevision++; }

  public void invalidateSuggestions() { suggestionRevision++; }
}

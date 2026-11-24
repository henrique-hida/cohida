package com.hida.cohida.chat.domain;



import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ChatCategoryInterestId implements Serializable {
  private Long customerId;
  private Long categoryId;

  protected ChatCategoryInterestId() {}

  public ChatCategoryInterestId(Long customerId, Long categoryId) {
    this.customerId = customerId;
    this.categoryId = categoryId;
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) return true;
    if (!(other instanceof ChatCategoryInterestId id)) return false;
    return Objects.equals(customerId, id.customerId)
        && Objects.equals(categoryId, id.categoryId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(customerId, categoryId);
  }
}

package com.hida.cohida.chat.domain;



import java.io.Serializable;
import java.util.Objects;

public class ChatResponseProductId implements Serializable {
  private Long responseId;
  private String productSlug;

  public ChatResponseProductId() {}

  @Override
  public boolean equals(Object other) {
    if (this == other) return true;
    if (!(other instanceof ChatResponseProductId id)) return false;
    return Objects.equals(responseId, id.responseId)
        && Objects.equals(productSlug, id.productSlug);
  }

  @Override
  public int hashCode() { return Objects.hash(responseId, productSlug); }
}

package com.hida.cohida.chat.domain;



import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@IdClass(ChatResponseProductId.class)
@Table(name = "chat_response_products")
public class ChatResponseProduct {
  @Id private Long responseId;
  @Id @Column(length = 160) private String productSlug;
  private int position;

  protected ChatResponseProduct() {}

  public ChatResponseProduct(long responseId, String productSlug,
      int position) {
    this.responseId = responseId;
    this.productSlug = productSlug;
    this.position = position;
  }

  public Long responseId() { return responseId; }
  public String productSlug() { return productSlug; }
}

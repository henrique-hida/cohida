package com.hida.cohida.chat.domain;



import com.hida.cohida.category.domain.Category;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_category_interests")
public class ChatCategoryInterest {
  @EmbeddedId
  private ChatCategoryInterestId id;

  @MapsId("categoryId")
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id", nullable = false)
  private Category category;

  @Column(length = 20)
  private String experience;

  protected ChatCategoryInterest() {}

  public ChatCategoryInterest(long customerId, Category category,
      String experience) {
    this.id = new ChatCategoryInterestId(customerId, category.getId());
    this.category = category;
    this.experience = experience;
  }

  public Category category() { return category; }

  public String experience() { return experience; }
}

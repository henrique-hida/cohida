package com.hida.cohida.category.domain;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "category_chat_suggestions")
public class CategoryChatSuggestion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(nullable = false)
  private Long categoryId;
  @Column(nullable = false, length = 240)
  private String question;
  @Column(nullable = false)
  private int position;
  @Column(nullable = false)
  private boolean active = true;
  @Column(nullable = false, length = 20)
  private String origin;

  protected CategoryChatSuggestion() {}

  public CategoryChatSuggestion(long categoryId, String question, int position,
      String origin) {
    this.categoryId = categoryId;
    this.question = question;
    this.position = position;
    this.origin = origin;
  }

  public String question() { return question; }
}

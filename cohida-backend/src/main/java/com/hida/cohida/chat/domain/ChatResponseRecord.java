package com.hida.cohida.chat.domain;



import jakarta.persistence.Entity;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_responses")
public class ChatResponseRecord {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private long customerId;
  @Column(nullable = false, columnDefinition = "TEXT")
  private String question;
  @Column(nullable = false, columnDefinition = "TEXT")
  private String response;
  @Column(nullable = false, length = 200)
  private String model;
  private Boolean useful;
  private LocalDateTime createdAt;
  private LocalDateTime feedbackAt;

  protected ChatResponseRecord() {}

  public ChatResponseRecord(long customerId, String question, String response,
      String model) {
    this.customerId = customerId;
    this.question = question;
    this.response = response;
    this.model = model;
    this.createdAt = LocalDateTime.now();
  }

  public long id() { return id; }
  public String question() { return question; }
  public String response() { return response; }
  public Boolean useful() { return useful; }

  public void rate(boolean useful) {
    this.useful = useful;
    this.feedbackAt = LocalDateTime.now();
  }
}

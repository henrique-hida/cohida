package com.hida.cohida.chat.dto;

import java.util.List;

public final class ChatDtos {
  private ChatDtos() {}

  public record Message(String role, String content) {}

  public record ChatRequest(String message, List<Message> history) {}

  public record ProductCard(
      long id,
      String slug,
      String name,
      String brand,
      String imageUrl,
      long priceCents) {}

  public record ChatResponse(
      long id, String content, List<ProductCard> products,
      String suggestedInterest) {}

  public record Suggestions(List<String> suggestions, boolean fallback) {}

  public record Feedback(Boolean useful) {}

  public record CategoryInterest(long categoryId, String name,
      String experience) {}

  public record HistoryEntry(
      long id, String question, String response, Boolean useful) {}

  public record DisplayHistory(
      long id, String question, String response, Boolean useful,
      List<ProductCard> products) {}
}

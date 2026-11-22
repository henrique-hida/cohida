package com.hida.cohida.chat;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/me/chat")
@PreAuthorize("hasRole('CUSTOMER')")
public class ChatController {
  private final ChatService chat;

  public ChatController(ChatService chat) {
    this.chat = chat;
  }

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
      long id, String content, List<ProductCard> products) {}

  public record Preferences(String preferences) {}

  public record Suggestions(List<String> suggestions, boolean fallback) {}

  public record Feedback(Boolean useful) {}

  @GetMapping("/preferences")
  public Preferences preferences(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    return new Preferences(chat.preferences(customer.customerId()));
  }

  @PutMapping("/preferences")
  public Preferences preferences(
      @AuthenticationPrincipal AuthenticatedCustomer customer,
      @RequestBody Preferences request) {
    return new Preferences(
        chat.savePreferences(customer.customerId(), request.preferences()));
  }

  @GetMapping("/suggestions")
  public Suggestions suggestions(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    return new Suggestions(chat.suggestions(customer.customerId()), false);
  }

  @PostMapping("/suggestions")
  public Suggestions generateSuggestions(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    var result = chat.generateSuggestions(customer.customerId());
    return new Suggestions(result.questions(), result.fallback());
  }

  @PostMapping("/messages")
  public ChatResponse message(
      @AuthenticationPrincipal AuthenticatedCustomer customer,
      @RequestBody ChatRequest request) {
    return chat.respond(customer.customerId(), request);
  }

  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  @PutMapping("/messages/{id}/feedback")
  public void feedback(
      @AuthenticationPrincipal AuthenticatedCustomer customer,
      @PathVariable long id,
      @RequestBody Feedback request) {
    chat.feedback(customer.customerId(), id, request.useful());
  }
}

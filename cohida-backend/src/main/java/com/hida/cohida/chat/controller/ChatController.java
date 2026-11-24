package com.hida.cohida.chat.controller;

import com.hida.cohida.chat.service.ChatService;
import com.hida.cohida.chat.dto.ChatDtos.*;


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

  @GetMapping("/category-interests")
  public List<CategoryInterest> categoryInterests(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    return chat.categoryInterests(customer.customerId());
  }

  @PutMapping("/category-interests")
  public List<CategoryInterest> categoryInterests(
      @AuthenticationPrincipal AuthenticatedCustomer customer,
      @RequestBody List<CategoryInterest> interests) {
    return chat.saveCategoryInterests(customer.customerId(), interests);
  }

  @DeleteMapping("/category-interests")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void clearCategoryInterests(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    chat.clearCategoryInterests(customer.customerId());
  }

  @GetMapping("/experience-options")
  public List<String> experienceOptions() {
    return ChatService.EXPERIENCE_OPTIONS;
  }

  @GetMapping("/recommendations")
  public List<String> recommendations(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    return chat.recommendations(customer.customerId());
  }

  @GetMapping("/messages")
  public List<DisplayHistory> history(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    return chat.historyWithProducts(customer.customerId());
  }

  @DeleteMapping("/messages")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void clearHistory(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    chat.clearHistory(customer.customerId());
  }

  @GetMapping("/profile-suggestions")
  public Suggestions profileSuggestions(
      @AuthenticationPrincipal AuthenticatedCustomer customer) {
    return new Suggestions(
        chat.profileSuggestions(customer.customerId()), false);
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

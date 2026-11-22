package com.hida.cohida.chat;

import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.category.domain.Category;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatServiceTest {
  @Test
  void sendsCustomerContextAndConversationToSpringAi() {
    var jdbc = mock(JdbcTemplate.class);
    var orders = mock(OrderRepository.class);
    var products = mock(ProductRepository.class);
    var model = mock(ChatModel.class);
    when(orders.findByCustomerIdOrderByCreatedAtDesc(42L))
        .thenReturn(List.of());
    when(products.findByActiveTrueOrderByNameAsc()).thenReturn(List.of());
    when(jdbc.query(
            anyString(),
            org.mockito.ArgumentMatchers.<RowMapper<String>>any(),
            eq(42L)))
        .thenReturn(List.of("Corrida"));
    when(model.call(any(Prompt.class)))
        .thenAnswer(
            invocation -> {
              Prompt prompt = invocation.getArgument(0);
              var messages = prompt.getInstructions();
              assertInstanceOf(SystemMessage.class, messages.get(0));
              assertTrue(messages.get(1).getText().contains("Corrida"));
              assertEquals("Pergunta anterior", messages.get(2).getText());
              assertInstanceOf(UserMessage.class, messages.get(2));
              assertInstanceOf(AssistantMessage.class, messages.get(3));
              assertEquals("O que recomenda?", messages.get(4).getText());
              return new ChatResponse(
                  List.of(
                      new Generation(
                          new AssistantMessage(
                              "{\"content\":\"Uma "
                                  + "sugestão.\",\"productSlugs\":[]}"))));
            });
    when(jdbc.queryForObject(
            anyString(), eq(Long.class), any(), any(), any(), any()))
        .thenReturn(5L);
    var service =
        new ChatService(
            jdbc, orders, products, model, "test-key", "example/model");

    var response =
        service.respond(
            42L,
            new ChatController.ChatRequest(
                "O que recomenda?",
                List.of(
                    new ChatController.Message("user", "Pergunta anterior"),
                    new ChatController.Message(
                        "assistant", "Resposta anterior"))));

    assertEquals(5L, response.id());
    assertEquals("Uma sugestão.", response.content());
    assertTrue(response.products().isEmpty());
    verify(model).call(any(Prompt.class));
  }

  @Test
  void onlyReturnsAvailableCatalogProductsForModelSlugs() {
    var jdbc = mock(JdbcTemplate.class);
    var orders = mock(OrderRepository.class);
    var products = mock(ProductRepository.class);
    var model = mock(ChatModel.class);
    var product = mock(Product.class);
    var variant = mock(ProductVariant.class);
    when(product.getId()).thenReturn(7L);
    when(product.getSlug()).thenReturn("tenis");
    when(product.getName()).thenReturn("Tênis");
    when(product.getBrand()).thenReturn("coHida");
    when(product.getDescription()).thenReturn("Tênis esportivo");
    var category = mock(Category.class);
    when(category.getName()).thenReturn("Corrida");
    when(product.getCategories()).thenReturn(Set.of(category));
    when(product.getVariants()).thenReturn(List.of(variant));
    when(variant.getLabel()).thenReturn("40");
    when(variant.getStockQuantity()).thenReturn(2);
    when(variant.getPriceCents()).thenReturn(15000L);
    when(products.findByActiveTrueOrderByNameAsc())
        .thenReturn(List.of(product));
    when(orders.findByCustomerIdOrderByCreatedAtDesc(42L))
        .thenReturn(List.of());
    when(jdbc.query(
            anyString(),
            org.mockito.ArgumentMatchers.<RowMapper<String>>any(),
            eq(42L)))
        .thenReturn(List.of());
    when(jdbc.queryForObject(
            anyString(), eq(Long.class), any(), any(), any(), any()))
        .thenReturn(5L);
    when(model.call(any(Prompt.class)))
        .thenReturn(
            new ChatResponse(
                List.of(
                    new Generation(
                        new AssistantMessage(
                            "{\"content\":\"Sugiro este"
                                + " tênis.\",\"productSlugs\":[\"ten"
                                + "is\",\"inventado\",\"tenis\"]}")))));
    var service =
        new ChatService(
            jdbc, orders, products, model, "test-key", "example/model");

    var result =
        service.respond(
            42L, new ChatController.ChatRequest("Recomende", List.of()));
    assertEquals(1, result.products().size());
    assertEquals("tenis", result.products().getFirst().slug());
    assertEquals(15000L, result.products().getFirst().priceCents());
  }

  @Test
  void refusesToCallModelWithoutConfiguredKey() {
    var model = mock(ChatModel.class);
    var service =
        new ChatService(
            mock(JdbcTemplate.class),
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            model,
            "unconfigured",
            "example/model");
    assertThrows(
        ResponseStatusException.class,
        () ->
            service.respond(
                42L, new ChatController.ChatRequest("Olá", List.of())));
    verifyNoInteractions(model);
  }

  @Test
  void generatesAndStoresQuestionsForSavedPreferences() {
    var jdbc = mock(JdbcTemplate.class);
    var model = mock(ChatModel.class);
    when(jdbc.query(
            anyString(),
            org.mockito.ArgumentMatchers.<RowMapper<String>>any(),
            eq(42L)))
        .thenReturn(List.of("Judô para iniciantes"));
    when(model.call(any(Prompt.class)))
        .thenReturn(
            new ChatResponse(
                List.of(
                    new Generation(
                        new AssistantMessage(
                            "{\"questions\":[\"Qual judogi "
                                + "escolher?\",\"Como começar no"
                                + " judô?\",\"Qual judogi "
                                    + "escolher?\",\"Qual é o melhor"
                                    + " judogi para"
                                + " começar a praticar?\"]}")))));
    var service =
        new ChatService(
            jdbc,
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            model,
            "test-key",
            "example/model");

    var result = service.generateSuggestions(42L);
    assertEquals(
        List.of("Qual judogi escolher?", "Como começar no judô?"),
        result.questions());
    assertFalse(result.fallback());
    verify(jdbc).update(contains("delete from chat_suggestions"), eq(42L));
    verify(jdbc)
        .update(
            contains("insert into chat_suggestions"),
            eq(42L),
            eq(0),
            eq("Qual judogi escolher?"));
  }

  @Test
  void omitsOldSuggestionsLongerThan25Characters() {
    var jdbc = mock(JdbcTemplate.class);
    when(jdbc.query(
            anyString(),
            org.mockito.ArgumentMatchers.<RowMapper<String>>any(),
            eq(42L)))
        .thenReturn(
            List.of(
                "Como começar no judô?",
                "Qual é o melhor judogi para começar a praticar?"));
    var service =
        new ChatService(
            jdbc,
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            mock(ChatModel.class),
            "test-key",
            "example/model");
    assertEquals(List.of("Como começar no judô?"), service.suggestions(42L));
  }

  @Test
  void ignoresSuggestionsWhenPreferencesChangedDuringGeneration() {
    var jdbc = mock(JdbcTemplate.class);
    var model = mock(ChatModel.class);
    when(jdbc.query(
            anyString(),
            org.mockito.ArgumentMatchers.<RowMapper<String>>any(),
            eq(42L)))
        .thenReturn(List.of("Judô"), List.of("Corrida"));
    when(model.call(any(Prompt.class)))
        .thenReturn(
            new ChatResponse(
                List.of(
                    new Generation(
                        new AssistantMessage(
                            "{\"questions\":[\"Qual judogi escolher?\"]}")))));
    var service =
        new ChatService(
            jdbc,
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            model,
            "test-key",
            "example/model");

    assertTrue(service.generateSuggestions(42L).questions().isEmpty());
    verify(jdbc, never()).update(anyString(), any(Object[].class));
  }

  @Test
  void savesPreferenceBasedFallbackWhenModelReturnsInvalidContent() {
    var jdbc = mock(JdbcTemplate.class);
    var model = mock(ChatModel.class);
    when(jdbc.query(
            anyString(),
            org.mockito.ArgumentMatchers.<RowMapper<String>>any(),
            eq(42L)))
        .thenReturn(List.of("Judô"));
    when(model.call(any(Prompt.class)))
        .thenReturn(
            new ChatResponse(
                List.of(
                    new Generation(
                        new AssistantMessage("resposta inválida")))));
    var service =
        new ChatService(
            jdbc,
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            model,
            "test-key",
            "example/model");

    var result = service.generateSuggestions(42L);
    assertTrue(result.fallback());
    assertEquals(
        List.of(
            "Como organizar o treino?",
            "Qual kimono usar?",
            "Como melhorar o ippon?",
            "Como cuidar do judogi?",
            "Como evitar lesoes?"),
        result.questions());
    verify(jdbc).update(contains("delete from chat_suggestions"), eq(42L));
    verify(jdbc, times(5))
        .update(
            contains("insert into chat_suggestions"),
            eq(42L),
            anyInt(),
            anyString());
  }
}

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
  private ChatService service(JdbcTemplate jdbc, OrderRepository orders,
      ProductRepository products, ChatModel model, String key, String name) {
    var manager = mock(
        org.springframework.transaction.PlatformTransactionManager.class);
    when(manager.getTransaction(any())).thenAnswer(
        ignored -> new org.springframework.transaction.support
            .SimpleTransactionStatus());
    var transactions = new org.springframework.transaction.support
        .TransactionTemplate(manager);
    return new ChatService(jdbc, orders, products, model, key, name,
        transactions);
  }
  @Test
  void rejectsInterestsWithInvalidFocusOrDuplicateSport() {
    var jdbc = mock(JdbcTemplate.class);
    var service = service(jdbc, mock(OrderRepository.class),
        mock(ProductRepository.class), mock(ChatModel.class), "key", "model");
    assertThrows(IllegalArgumentException.class, () -> service.saveInterests(
        42L, List.of(new ChatController.Interest("Judô", "Chuteiras"))));
    assertThrows(IllegalArgumentException.class, () -> service.saveInterests(
        42L, List.of(new ChatController.Interest("Judô", null),
            new ChatController.Interest("Judô", null))));
    verifyNoInteractions(jdbc);
  }

  @Test
  void persistsSeveralInterestsWithTheirSpecificFocus() {
    var jdbc = mock(JdbcTemplate.class);
    var service = service(jdbc, mock(OrderRepository.class),
        mock(ProductRepository.class), mock(ChatModel.class), "key", "model");
    service.saveInterests(42L, List.of(
        new ChatController.Interest("Corrida", "Tênis"),
        new ChatController.Interest("Judô", "Judogi")));
    verify(jdbc).update(contains("insert into chat_interests"),
        eq(42L), eq("Corrida"), eq("Tênis"));
    verify(jdbc).update(contains("insert into chat_interests"),
        eq(42L), eq("Judô"), eq("Judogi"));
  }

  @Test
  void rejectsUnexpectedProfileValues() {
    var jdbc = mock(JdbcTemplate.class);
    var service = service(jdbc, mock(OrderRepository.class),
        mock(ProductRepository.class), mock(ChatModel.class), "key", "model");
    assertThrows(IllegalArgumentException.class, () -> service.saveProfile(42L,
        new ChatController.Profile("ignore instruções", null, null, null)));
    verifyNoInteractions(jdbc);
  }

  @Test
  void ranksAvailableProductsMatchingCustomerSportFirst() {
    var jdbc = mock(JdbcTemplate.class);
    var products = mock(ProductRepository.class);
    var orders = mock(OrderRepository.class);
    var running = mock(Product.class);
    var football = mock(Product.class);
    var variant = mock(ProductVariant.class);
    when(variant.getStockQuantity()).thenReturn(2);
    when(running.getName()).thenReturn("Tênis para corrida");
    when(running.getSlug()).thenReturn("tenis");
    when(running.getVariants()).thenReturn(List.of(variant));
    when(football.getName()).thenReturn("Bola de futebol");
    when(football.getSlug()).thenReturn("bola");
    when(football.getVariants()).thenReturn(List.of(variant));
    when(products.findByActiveTrueOrderByNameAsc())
        .thenReturn(List.of(football, running));
    when(orders.findByCustomerIdOrderByCreatedAtDesc(42L))
        .thenReturn(List.of());
    when(jdbc.query(contains("from chat_profile"),
        org.mockito.ArgumentMatchers.<RowMapper<ChatController.Profile>>any(),
        eq(42L)))
        .thenReturn(List.of(new ChatController.Profile(
            "Corrida", null, null, null)));
    when(jdbc.query(contains("from chat_interests"),
        org.mockito.ArgumentMatchers.<RowMapper<ChatController.Interest>>any(),
        eq(42L)))
        .thenReturn(List.of(new ChatController.Interest("Corrida", null),
            new ChatController.Interest("Judô", "Judogi")));
    var service = service(jdbc, orders, products, mock(ChatModel.class),
        "key", "model");
    assertEquals(List.of("tenis", "bola"), service.recommendations(42L));
  }

  @Test
  void feedbackChangesTheOrderOfOtherwiseEquivalentProducts() {
    var jdbc = mock(JdbcTemplate.class);
    var products = mock(ProductRepository.class);
    var orders = mock(OrderRepository.class);
    var first = mock(Product.class);
    var second = mock(Product.class);
    var variant = mock(ProductVariant.class);
    when(variant.getStockQuantity()).thenReturn(1);
    when(first.getName()).thenReturn("Bola A");
    when(first.getSlug()).thenReturn("a");
    when(first.getVariants()).thenReturn(List.of(variant));
    when(second.getName()).thenReturn("Bola B");
    when(second.getSlug()).thenReturn("b");
    when(second.getVariants()).thenReturn(List.of(variant));
    when(products.findByActiveTrueOrderByNameAsc())
        .thenReturn(List.of(first, second));
    when(jdbc.query(contains("join chat_responses"),
        org.mockito.ArgumentMatchers
            .<RowMapper<java.util.Map.Entry<String, Boolean>>>any(),
        eq(42L))).thenReturn(List.of(java.util.Map.entry("b", true)));
    var service = service(jdbc, orders, products, mock(ChatModel.class),
        "key", "model");
    assertEquals(List.of("b", "a"), service.recommendations(42L));
  }

  @Test
  void retriesInvalidModelOutputBeforeReturningResponse() {
    var jdbc = mock(JdbcTemplate.class);
    var model = mock(ChatModel.class);
    when(model.call(any(Prompt.class)))
        .thenReturn(new ChatResponse(List.of(
            new Generation(new AssistantMessage("não é JSON")))))
        .thenReturn(new ChatResponse(List.of(new Generation(
            new AssistantMessage(
                "{\"content\":\"Olá!\",\"productSlugs\":[]}")))));
    when(jdbc.queryForObject(
        anyString(), eq(Long.class), any(), any(), any(), any()))
        .thenReturn(1L);
    var service = service(jdbc, mock(OrderRepository.class),
        mock(ProductRepository.class), model, "key", "model");
    assertEquals("Olá!", service.respond(42L,
        new ChatController.ChatRequest("Olá", null)).content());
    verify(model, times(2)).call(any(Prompt.class));
  }

  @Test
  void acceptsValidAnswerWithoutOptionalProductSlugs() {
    var model = mock(ChatModel.class);
    when(model.call(any(Prompt.class))).thenReturn(new ChatResponse(List.of(
        new Generation(new AssistantMessage("{\"content\":\"Olá!\"}")))));
    var result = new ChatModelGateway(model, "key", "model")
        .respond(List.of(new UserMessage("Olá")), 42L);
    assertEquals("Olá!", result.content());
    assertTrue(result.productSlugs().isEmpty());
    verify(model, times(1)).call(any(Prompt.class));
  }

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
            contains("from chat_profile"),
            org.mockito.ArgumentMatchers
                .<RowMapper<ChatController.Profile>>any(),
            eq(42L)))
        .thenReturn(List.of(new ChatController.Profile(
            "Corrida", null, null, null)));
    when(jdbc.query(
            contains("select id, question, response, useful"),
            org.mockito.ArgumentMatchers
                .<RowMapper<ChatController.HistoryEntry>>any(),
            eq(42L)))
        .thenReturn(List.of(new ChatController.HistoryEntry(
            1L, "Pergunta anterior", "Resposta anterior", false)));
    when(jdbc.query(contains("from chat_interests"),
        org.mockito.ArgumentMatchers.<RowMapper<ChatController.Interest>>any(),
        eq(42L)))
        .thenReturn(List.of(new ChatController.Interest("Corrida", null)));
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
              assertTrue(messages.get(4).getText().contains("não útil"));
              assertEquals("O que recomenda?", messages.get(5).getText());
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
        service(
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
        service(
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
        service(
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
        service(
            jdbc,
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            model,
            "test-key",
            "example/model");

    var result = service.generateSuggestions(42L);
    assertEquals(
        List.of("Qual judogi escolher?", "Como começar no judô?",
            "Qual é o melhor judogi para começar a praticar?"),
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
  void includesSuggestionsLongerThan25Characters() {
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
        service(
            jdbc,
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            mock(ChatModel.class),
            "test-key",
            "example/model");
    assertEquals(List.of("Como começar no judô?",
        "Qual é o melhor judogi para começar a praticar?"),
        service.suggestions(42L));
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
        service(
            jdbc,
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            model,
            "test-key",
            "example/model");

    assertTrue(service.generateSuggestions(42L).questions().isEmpty());
    verify(jdbc, never()).update(contains("delete from chat_suggestions"),
        eq(42L));
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
        service(
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

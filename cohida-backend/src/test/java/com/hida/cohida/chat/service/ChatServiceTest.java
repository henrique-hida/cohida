package com.hida.cohida.chat.service;

import com.hida.cohida.chat.dto.ChatDtos;
import com.hida.cohida.chat.domain.ChatCategoryInterest;
import com.hida.cohida.chat.domain.ChatResponseRecord;
import com.hida.cohida.chat.repository.ChatCategoryInterestRepository;
import com.hida.cohida.chat.repository.ChatResponseRepository;
import com.hida.cohida.chat.repository.ChatHistoryStore;
import com.hida.cohida.chat.repository.ChatSuggestionQuery;
import com.hida.cohida.chat.repository.ChatResponseProductRepository;


import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.category.domain.Category;
import com.hida.cohida.category.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import com.hida.cohida.chat.domain.ChatState;
import com.hida.cohida.chat.repository.ChatStateRepository;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatServiceTest {
  private final ChatResponseProductRepository responseProducts =
      mock(ChatResponseProductRepository.class);
  private final ChatResponseRepository responses =
      mock(ChatResponseRepository.class);
  private final CategoryRepository categories = mock(CategoryRepository.class);
  private final ChatCategoryInterestRepository interests =
      mock(ChatCategoryInterestRepository.class);

  private Category category(long id, String name) {
    var category = mock(Category.class);
    when(category.getId()).thenReturn(id);
    when(category.getName()).thenReturn(name);
    return category;
  }

  @Test
  void clearingPreferencesPreservesConversationHistory() {
    var states = mockStates();
    var service = service(states, mock(OrderRepository.class),
        mock(ProductRepository.class), mock(ChatModel.class), "key", "model");

    service.clearCategoryInterests(42L);

    verify(interests).deleteByCustomer(42L);
    verify(responses, never()).deleteByCustomer(42L);
  }

  @Test
  void doesNotRestoreCategoriesAfterPreferencesChangeDuringReply() {
    var states = mockStates();
    var model = mock(ChatModel.class);
    doReturn(List.of(category(7L, "Corrida"))).when(categories)
        .findByDeletedAtIsNullOrderByNameAsc();
    when(states.findById(42L).orElseThrow().suggestionRevision())
        .thenReturn(0L, 1L);
    when(model.call(any(Prompt.class))).thenReturn(new ChatResponse(List.of(
        new Generation(new AssistantMessage("{\"content\":\"Olá\","
            + "\"productSlugs\":[],\"categoryIds\":[7]}")))));
    var service = service(states, mock(OrderRepository.class),
        mock(ProductRepository.class), model, "key", "model");

    var result = service.respond(42L,
        new ChatDtos.ChatRequest("Eu pratico corrida", List.of()));

    assertNull(result.suggestedInterest());
    verify(interests, never()).addIfActive(42L, 7L);
  }

  @Test
  void addsOnlyActiveCategoriesReturnedByTheModel() {
    var states = mockStates();
    var model = mock(ChatModel.class);
    doReturn(List.of(category(7L, "Corrida"))).when(categories)
        .findByDeletedAtIsNullOrderByNameAsc();
    when(interests.addIfActive(42L, 7L)).thenReturn(1);
    when(model.call(any(Prompt.class))).thenReturn(new ChatResponse(List.of(
        new Generation(new AssistantMessage("{\"content\":\"Olá\","
            + "\"productSlugs\":[],\"categoryIds\":[7,999]}")))));
    var service = service(states, mock(OrderRepository.class),
        mock(ProductRepository.class), model, "key", "model");

    var result = service.respond(42L,
        new ChatDtos.ChatRequest("Eu pratico corrida", List.of()));

    assertEquals("Corrida", result.suggestedInterest());
    verify(interests).addIfActive(42L, 7L);
    verify(interests, never()).addIfActive(42L, 999L);
  }

  private ChatStateRepository mockStates() {
    var states = mock(ChatStateRepository.class);
    var state = mock(ChatState.class);
    when(states.findById(anyLong())).thenReturn(java.util.Optional.of(state));
    when(states.lockByCustomerId(anyLong()))
        .thenReturn(java.util.Optional.of(state));
    return states;
  }

  private ChatService service(
      ChatStateRepository states, OrderRepository orders,
      ProductRepository products, ChatModel model, String key, String name) {
    var manager = mock(
        org.springframework.transaction.PlatformTransactionManager.class);
    when(manager.getTransaction(any())).thenAnswer(
        ignored -> new org.springframework.transaction.support
            .SimpleTransactionStatus());
    var transactions = new org.springframework.transaction.support
        .TransactionTemplate(manager);
    var savedResponse = mock(ChatResponseRecord.class);
    when(savedResponse.id()).thenReturn(5L);
    when(responses.save(any())).thenReturn(savedResponse);
    return new ChatService(
        new ChatHistoryStore(states, responses, responseProducts),
        categories, interests, mock(ChatSuggestionQuery.class), responses,
        responseProducts, orders, products,
        model, key, name,
        transactions);
  }
  @Test
  void rejectsDuplicateCategoriesAndInvalidExperience() {
    var states = mockStates();
    var service = service(states, mock(OrderRepository.class),
        mock(ProductRepository.class), mock(ChatModel.class), "key", "model");
    assertThrows(IllegalArgumentException.class,
        () -> service.saveCategoryInterests(42L, List.of(
            new ChatDtos.CategoryInterest(
                1, "Corrida", "Especialista"))));
    assertThrows(IllegalArgumentException.class,
        () -> service.saveCategoryInterests(42L, List.of(
            new ChatDtos.CategoryInterest(1, "Corrida", null),
            new ChatDtos.CategoryInterest(1, "Corrida", null))));
  }

  @Test
  void ranksAvailableProductsMatchingCustomerCategoryFirst() {
    var states = mockStates();
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
    var runningCategory = mock(Category.class);
    when(runningCategory.getId()).thenReturn(10L);
    when(running.getCategories()).thenReturn(Set.of(runningCategory));
    var interest = mock(ChatCategoryInterest.class);
    doReturn(category(10L, "Corrida")).when(interest).category();
    when(interest.experience()).thenReturn("Iniciante");
    when(interests.findActive(42L)).thenReturn(List.of(interest));
    var service = service(states, orders, products, mock(ChatModel.class),
        "key", "model");
    assertEquals(List.of("tenis", "bola"), service.recommendations(42L));
  }

  @Test
  void feedbackChangesTheOrderOfOtherwiseEquivalentProducts() {
    var states = mockStates();
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
    when(responseProducts.findFeedback(eq(42L), any()))
        .thenReturn(List.<Object[]>of(new Object[]{"b", true}));
    var service = service(states, orders, products, mock(ChatModel.class),
        "key", "model");
    assertEquals(List.of("b", "a"), service.recommendations(42L));
  }

  @Test
  void retriesInvalidModelOutputBeforeReturningResponse() {
    var states = mockStates();
    var model = mock(ChatModel.class);
    when(model.call(any(Prompt.class)))
        .thenReturn(new ChatResponse(List.of(
            new Generation(new AssistantMessage("não é JSON")))))
        .thenReturn(new ChatResponse(List.of(new Generation(
            new AssistantMessage(
                "{\"content\":\"Olá!\",\"productSlugs\":[]}")))));
    var service = service(states, mock(OrderRepository.class),
        mock(ProductRepository.class), model, "key", "model");
    assertEquals("Olá!", service.respond(42L,
        new ChatDtos.ChatRequest("Olá", null)).content());
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
    var states = mockStates();
    var orders = mock(OrderRepository.class);
    var products = mock(ProductRepository.class);
    var model = mock(ChatModel.class);
    when(orders.findByCustomerIdOrderByCreatedAtDesc(42L))
        .thenReturn(List.of());
    when(products.findByActiveTrueOrderByNameAsc()).thenReturn(List.of());
    var previous = mock(ChatResponseRecord.class);
    when(previous.id()).thenReturn(1L);
    when(previous.question()).thenReturn("Pergunta anterior");
    when(previous.response()).thenReturn("Resposta anterior");
    when(previous.useful()).thenReturn(false);
    when(responses.findTop50ByCustomerIdOrderByIdDesc(42L))
        .thenReturn(List.of(previous));
    var interest = mock(ChatCategoryInterest.class);
    doReturn(category(10L, "Corrida")).when(interest).category();
    when(interest.experience()).thenReturn("Iniciante");
    when(interests.findActive(42L)).thenReturn(List.of(interest));
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
    var service =
        service(
            states, orders, products, model, "test-key", "example/model");

    var response =
        service.respond(
            42L,
            new ChatDtos.ChatRequest(
                "O que recomenda?",
                List.of(
                    new ChatDtos.Message("user", "Pergunta anterior"),
                    new ChatDtos.Message(
                        "assistant", "Resposta anterior"))));

    assertEquals(5L, response.id());
    assertEquals("Uma sugestão.", response.content());
    assertTrue(response.products().isEmpty());
    verify(model).call(any(Prompt.class));
  }

  @Test
  void onlyReturnsAvailableCatalogProductsForModelSlugs() {
    var states = mockStates();
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
            states, orders, products, model, "test-key", "example/model");

    var result =
        service.respond(
            42L, new ChatDtos.ChatRequest("Recomende", List.of()));
    assertEquals(1, result.products().size());
    assertEquals("tenis", result.products().getFirst().slug());
    assertEquals(15000L, result.products().getFirst().priceCents());
  }

  @Test
  void refusesToCallModelWithoutConfiguredKey() {
    var model = mock(ChatModel.class);
    var service =
        service(
            mockStates(),
            mock(OrderRepository.class),
            mock(ProductRepository.class),
            model,
            "unconfigured",
            "example/model");
    assertThrows(
        ResponseStatusException.class,
        () ->
            service.respond(
                42L, new ChatDtos.ChatRequest("Olá", List.of())));
    verifyNoInteractions(model);
  }

}

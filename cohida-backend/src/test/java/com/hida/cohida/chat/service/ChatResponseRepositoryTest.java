package com.hida.cohida.chat.service;

import com.hida.cohida.chat.domain.ChatResponseProduct;
import com.hida.cohida.chat.domain.ChatResponseRecord;
import com.hida.cohida.chat.repository.ChatResponseProductRepository;
import com.hida.cohida.chat.repository.ChatResponseRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class ChatResponseRepositoryTest {
  @Autowired private ChatResponseRepository responses;
  @Autowired private ChatResponseProductRepository products;

  @Test
  void historyAndFeedbackAreScopedToTheCustomer() {
    var first = responses.save(new ChatResponseRecord(
        41L, "Pergunta", "Resposta", "teste"));
    first.rate(true);
    responses.save(new ChatResponseRecord(42L, "Outra", "Resposta", "teste"));
    products.saveAndFlush(new ChatResponseProduct(first.id(), "tenis", 0));
    responses.flush();

    assertEquals(1, responses.findTop50ByCustomerIdOrderByIdDesc(41L).size());
    assertTrue(responses.findByIdAndCustomerId(first.id(), 42L).isEmpty());
    assertEquals(List.of("tenis"),
        products.findByResponseIdInOrderByResponseIdAscPositionAsc(
            List.of(first.id())).stream().map(ChatResponseProduct::productSlug)
            .toList());
    var feedback = products.findFeedback(41L, PageRequest.of(0, 100));
    assertEquals(1, feedback.size());
    assertEquals("tenis", feedback.get(0)[0]);
    assertEquals(true, feedback.get(0)[1]);
  }

  @Test
  void preservesMessagesLongerThanTheDefaultStringColumn() {
    String question = "a".repeat(2000);
    String answer = "b".repeat(4000);
    var saved = responses.saveAndFlush(new ChatResponseRecord(
        41L, question, answer, "teste"));

    var loaded = responses.findByIdAndCustomerId(saved.id(), 41L).orElseThrow();
    assertEquals(question, loaded.question());
    assertEquals(answer, loaded.response());
  }
}

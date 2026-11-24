package com.hida.cohida.chat.service;



import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CategoryQuestionGeneratorTest {
  private ChatModel modelReturning(String json) {
    var model = mock(ChatModel.class);
    when(model.call(any(Prompt.class))).thenReturn(new ChatResponse(
        List.of(new Generation(new AssistantMessage(json)))));
    return model;
  }

  @Test
  void acceptsFourDifferentQuestions() {
    var generator = new CategoryQuestionGenerator(modelReturning(
        "{\"questions\":[\" Uma? \",\"Duas?\",\"Três?\",\"Quatro?\"]}"),
        "test-key", "test-model");
    assertEquals(List.of("Uma?", "Duas?", "Três?", "Quatro?"),
        generator.generate("Corrida", "Produtos para corrida"));
  }

  @Test
  void rejectsInvalidCountAndDuplicates() {
    var shortList = new CategoryQuestionGenerator(modelReturning(
        "{\"questions\":[\"Uma?\"]}"), "test-key", "test-model");
    var duplicate = new CategoryQuestionGenerator(modelReturning(
        "{\"questions\":[\"Uma?\",\"uma?\",\"Três?\",\"Quatro?\"]}"),
        "test-key", "test-model");
    assertThrows(IllegalStateException.class,
        () -> shortList.generate("Corrida", "Descrição"));
    assertThrows(IllegalStateException.class,
        () -> duplicate.generate("Corrida", "Descrição"));
  }
}

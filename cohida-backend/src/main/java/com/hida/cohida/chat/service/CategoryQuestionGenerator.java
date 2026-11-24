package com.hida.cohida.chat.service;



import java.util.List;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CategoryQuestionGenerator {
  private final ChatModelGateway gateway;

  public CategoryQuestionGenerator(ChatModel model,
      @Value("${cohida.openrouter.api-key:}") String key,
      @Value("${cohida.openrouter.model:openrouter/free}") String modelName) {
    gateway = new ChatModelGateway(model, key, modelName);
  }

  public List<String> generate(String name, String description) {
    gateway.requireConfigured();
    return gateway.categorySuggestions(name, description);
  }
}

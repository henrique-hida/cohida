package com.hida.cohida.chat;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SpringAiOpenRouterTest {
  private static final AtomicReference<String> requestBody =
      new AtomicReference<>();
  private static HttpServer server;

  @DynamicPropertySource
  static void configure(DynamicPropertyRegistry registry) throws IOException {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/api/v1/chat/completions",
        exchange -> {
          requestBody.set(
              new String(
                  exchange.getRequestBody().readAllBytes(),
                  StandardCharsets.UTF_8));
          byte[] response =
              """
              {"id":"test","object":"chat.completion","created":0,"model":"exa\
              mple/model",
               "choices":[{"index":0,"message":{"role":"assistant","content":"\
              Resposta simulada"},"finish_reason":"stop"}]}
              """
                  .getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().set("Content-Type", "application/json");
          exchange.sendResponseHeaders(200, response.length);
          exchange.getResponseBody().write(response);
          exchange.close();
        });
    server.start();
    registry.add(
        "spring.ai.openai.base-url",
        () -> "http://127.0.0.1:" + server.getAddress().getPort() + "/api/v1");
    registry.add("spring.ai.openai.api-key", () -> "test-key");
    registry.add("spring.ai.openai.chat.model", () -> "example/model");
    registry.add("spring.ai.openai.chat.max-tokens", () -> "600");
  }

  @AfterAll
  static void stop() {
    if (server != null) server.stop(0);
  }

  @Autowired ChatModel chatModel;

  @Test
  void usesOpenAiCompatibleChatEndpoint() {
    var response =
        chatModel.call(
            new Prompt(
                new UserMessage("Olá, teste"),
                OpenAiChatOptions.builder()
                    .model("example/model")
                    .maxTokens(600)
                    .extraBody(
                        java.util.Map.of(
                            "reasoning", java.util.Map.of("max_tokens", 128)))
                    .build()));
    assertEquals(
        "Resposta simulada", response.getResult().getOutput().getText());
    assertNotNull(requestBody.get());
    assertTrue(requestBody.get().contains("example/model"));
    assertTrue(requestBody.get().contains("Olá, teste"));
    assertTrue(
        requestBody.get().matches("(?s).*\\\"max_tokens\\\"\\s*:\\s*600.*"));
    assertTrue(requestBody.get().contains("\"reasoning\""));
    assertTrue(requestBody.get().contains("128"));
  }
}

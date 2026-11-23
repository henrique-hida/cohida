package com.hida.cohida.chat;

import java.util.concurrent.atomic.AtomicReference;
import java.util.List;
import okhttp3.MediaType;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.Buffer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.http.okhttp.OpenAiHttpClientBuilderCustomizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(
    properties = {
      "spring.ai.openai.base-url=https://openrouter.test/api/v1",
      "spring.ai.openai.api-key=test-key",
      "spring.ai.openai.chat.model=example/model",
      "spring.ai.openai.chat.max-tokens=600"
    })
@Import(SpringAiOpenRouterTest.TestHttpConfig.class)
class SpringAiOpenRouterTest {
  private static final AtomicReference<Request> request =
      new AtomicReference<>();
  private static final AtomicReference<String> requestBody =
      new AtomicReference<>();

  @Autowired ChatModel chatModel;

  @BeforeEach
  void resetRequest() {
    request.set(null);
    requestBody.set(null);
  }

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
        "{\"content\":\"Resposta simulada\",\"productSlugs\":[]}",
        response.getResult().getOutput().getText());
    assertNotNull(request.get());
    assertEquals("POST", request.get().method());
    assertEquals("/api/v1/chat/completions", request.get().url().encodedPath());
    assertNotNull(requestBody.get());
    assertTrue(requestBody.get().contains("example/model"));
    assertTrue(requestBody.get().contains("Olá, teste"));
    assertTrue(
        requestBody.get().matches("(?s).*\\\"max_tokens\\\"\\s*:\\s*600.*"));
    assertTrue(requestBody.get().contains("\"reasoning\""));
    assertTrue(requestBody.get().contains("128"));
  }

  @Test
  void gatewayRequestsStrictSchemaAndRequiresCompatibleProvider() {
    var gateway = new ChatModelGateway(chatModel, "test-key", "example/model");
    gateway.respond(List.of(new UserMessage("Olá")), 1L);
    assertNotNull(requestBody.get());
    assertTrue(requestBody.get().contains("\"json_schema\""));
    assertTrue(requestBody.get().contains("\"strict\":true"));
    assertTrue(requestBody.get().contains("\"require_parameters\":true"));
    assertTrue(requestBody.get().contains("\"productSlugs\""));
  }

  @Test
  void suggestionsUseTheirOwnStructuredSchema() {
    var gateway = new ChatModelGateway(chatModel, "test-key", "example/model");
    assertEquals(List.of("Qual tênis?"), gateway.suggestions("Corrida", 1L));
    assertTrue(requestBody.get().contains("\"require_parameters\":true"));
    assertTrue(requestBody.get().contains("\"questions\""));
    assertTrue(requestBody.get().contains("\"json_schema\""));
  }

  @TestConfiguration(proxyBeanMethods = false)
  static class TestHttpConfig {
    @Bean
    OpenAiHttpClientBuilderCustomizer simulatedOpenRouter() {
      return builder ->
          builder.interceptor(
              chain -> {
                Request intercepted = chain.request();
                request.set(intercepted);
                Buffer body = new Buffer();
                if (intercepted.body() != null) {
                  intercepted.body().writeTo(body);
                }
                requestBody.set(body.readUtf8());
                String content = requestBody.get().contains("\"questions\"")
                    ? "{\\\"questions\\\":[\\\"Qual tênis?\\\"]}"
                    : "{\\\"content\\\":\\\"Resposta simulada\\\","
                        + "\\\"productSlugs\\\":[]}";
                String json =
                    "{\"id\":\"test\",\"object\":\"chat.completion\","
                        + "\"created\":0,\"model\":\"example/model\","
                        + "\"choices\":[{\"index\":0,\"message\":{"
                        + "\"role\":\"assistant\","
                        + "\"content\":\"" + content + "\"},"
                        + "\"finish_reason\":\"stop\"}]}";
                return new Response.Builder()
                    .request(intercepted)
                    .protocol(Protocol.HTTP_1_1)
                    .code(200)
                    .message("OK")
                    .body(
                        ResponseBody.create(
                            json, MediaType.get("application/json")))
                    .build();
              });
    }
  }
}

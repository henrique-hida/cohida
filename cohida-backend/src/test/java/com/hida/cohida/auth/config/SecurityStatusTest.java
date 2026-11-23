package com.hida.cohida.auth.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.hida.cohida.account.enums.AccountRole;
import com.hida.cohida.auth.service.JwtService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
      "security.jwt.secret=KQeY11CV76fs8pmKx5B6JCryplHbd90INjDtkFMQCCY=",
      "security.jwt.issuer=cohida-api",
      "security.jwt.access-token-ttl=1h",
      "cohida.openrouter.api-key=integration-test"
    })
class SecurityStatusTest {
  @LocalServerPort private int port;
  @Autowired private JwtService tokens;

  @Test
  void unauthenticatedIsUnauthorizedAndWrongRoleIsForbidden() throws Exception {
    var client = HttpClient.newHttpClient();
    var url = URI.create("http://127.0.0.1:" + port + "/api/admin/products");
    var anonymous = HttpRequest.newBuilder(url).GET().build();
    var customer = HttpRequest.newBuilder(url).GET().header("Authorization",
        "Bearer " + tokens.createAccessToken(
            123L, 123L, "customer@example.test", AccountRole.CUSTOMER)).build();
    assertEquals(401, client.send(anonymous,
        HttpResponse.BodyHandlers.discarding()).statusCode());
    assertEquals(403, client.send(customer,
        HttpResponse.BodyHandlers.discarding()).statusCode());
  }
}

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
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
      "security.jwt.secret=KQeY11CV76fs8pmKx5B6JCryplHbd90INjDtkFMQCCY=",
      "spring.datasource.url=jdbc:h2:mem:security_sessions",
      "security.jwt.issuer=cohida-api",
      "security.jwt.access-token-ttl=1h",
      "cohida.openrouter.api-key=integration-test"
    })
class SecurityStatusTest {
  @LocalServerPort private int port;
  @Autowired private JwtService tokens;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private JsonMapper json;

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

  @Test
  void refreshRotatesRejectsReplayAndSupportsRevocation() throws Exception {
    var client = HttpClient.newHttpClient();
    String base = "http://127.0.0.1:" + port + "/api/auth";
    String body = """
        {"name":"Cliente", "birthDate":"1990-01-01", "cpf":"52998224725",
         "phone":"11999999999", "email":"session@example.test",
         "password":"Test@123", "passwordConfirmation":"Test@123",
         "billingAddress":{"label":"Casa", "street":"Rua", "number":"1",
           "neighborhood":"Centro", "postalCode":"01001000", "city":"SP",
           "state":"SP", "country":"Brasil"},
         "deliveryAddress":{"label":"Casa", "street":"Rua", "number":"1",
           "neighborhood":"Centro", "postalCode":"01001000", "city":"SP",
           "state":"SP", "country":"Brasil"}}
        """;
    var register = HttpRequest.newBuilder(URI.create(base + "/register"))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body)).build();
    var created = client.send(register, HttpResponse.BodyHandlers.ofString());
    assertEquals(201, created.statusCode());
    String id = json.readTree(created.body()).get("sessionId").asString();
    String firstCookie =
        created.headers().firstValue("Set-Cookie").orElseThrow();
    org.junit.jupiter.api.Assertions.assertTrue(
        firstCookie.contains("HttpOnly"));
    String cookie = firstCookie.split(";", 2)[0];
    String secret = cookie.substring(cookie.indexOf('=') + 1);
    String stored = jdbc.queryForObject(
        "select refresh_token_hash from auth_sessions where id = ?",
        String.class, id);
    org.junit.jupiter.api.Assertions.assertNotEquals(secret, stored);
    String refreshPath = base + "/sessions/" + id + "/refresh";
    var missingHeader = HttpRequest.newBuilder(URI.create(refreshPath))
        .header("Cookie", cookie)
        .POST(HttpRequest.BodyPublishers.noBody()).build();
    assertEquals(403, client.send(missingHeader,
        HttpResponse.BodyHandlers.discarding()).statusCode());
    var refresh = HttpRequest.newBuilder(URI.create(refreshPath))
        .header("Cookie", cookie).header("X-Cohida-Session", "1")
        .POST(HttpRequest.BodyPublishers.noBody()).build();
    var rotated = client.send(refresh, HttpResponse.BodyHandlers.ofString());
    assertEquals(200, rotated.statusCode());
    assertEquals(401, client.send(refresh,
        HttpResponse.BodyHandlers.discarding()).statusCode());
    String newCookie = rotated.headers().firstValue("Set-Cookie")
        .orElseThrow().split(";", 2)[0];
    var logout = HttpRequest.newBuilder(
        URI.create(base + "/sessions/" + id + "/logout"))
        .header("Cookie", newCookie).header("X-Cohida-Session", "1")
        .POST(HttpRequest.BodyPublishers.noBody()).build();
    assertEquals(204, client.send(logout,
        HttpResponse.BodyHandlers.discarding()).statusCode());
    var afterLogout = HttpRequest.newBuilder(URI.create(refreshPath))
        .header("Cookie", newCookie).header("X-Cohida-Session", "1")
        .POST(HttpRequest.BodyPublishers.noBody()).build();
    assertEquals(401, client.send(afterLogout,
        HttpResponse.BodyHandlers.discarding()).statusCode());
  }
}

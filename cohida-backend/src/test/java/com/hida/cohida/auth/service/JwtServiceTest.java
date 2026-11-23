package com.hida.cohida.auth.service;

import com.hida.cohida.account.enums.AccountRole;
import com.hida.cohida.auth.config.JwtProperties;
import com.hida.cohida.auth.security.AuthenticatedCustomer;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {
  private static final JwtProperties PROPERTIES =
      new JwtProperties(
          "KQeY11CV76fs8pmKx5B6JCryplHbd90INjDtkFMQCCY=",
          "cohida-test",
          Duration.ofMinutes(15));

  @Test
  void createsAndParsesAnAccessToken() {
    JwtService service = new JwtService(PROPERTIES);

    String token =
        service.createAccessToken(
            42L, "customer@example.com", AccountRole.CUSTOMER);
    AuthenticatedCustomer customer = service.parse(token).orElseThrow();

    assertEquals(42L, customer.id());
    assertEquals("customer@example.com", customer.email());
    assertEquals(AccountRole.CUSTOMER, customer.role());
  }

  @Test
  void rejectsTamperedTokens() {
    JwtService service = new JwtService(PROPERTIES);
    String token =
        service.createAccessToken(
            42L, "customer@example.com", AccountRole.CUSTOMER);

    assertTrue(service.parse(token + "tampered").isEmpty());
  }

  @Test
  void rejectsPreviouslyLongLivedTokenBeyondCurrentLifetime() {
    var oldProperties = new JwtProperties(PROPERTIES.secret(),
        PROPERTIES.issuer(), Duration.ofDays(30));
    var issuedYesterday = java.time.Clock.fixed(
        java.time.Instant.now().minus(Duration.ofDays(1)),
        java.time.ZoneOffset.UTC);
    var oldIssuer = new JwtService(oldProperties, issuedYesterday);
    String token = oldIssuer.createAccessToken(
        42L, "customer@example.com", AccountRole.CUSTOMER);
    assertTrue(new JwtService(PROPERTIES).parse(token).isEmpty());
  }
}

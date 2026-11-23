package com.hida.cohida.auth.config;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

import com.hida.cohida.auth.controller.AuthController;
import com.hida.cohida.auth.service.AuthService;
import com.hida.cohida.auth.session.RefreshSessionService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;

class ProductionSecurityTest {
  @Test
  void productionRequiresExplicitHttpsOriginsAndSecureCookies() {
    var environment = new MockEnvironment();
    environment.setActiveProfiles("prod");
    var config = new SecurityConfig();
    assertThrows(IllegalStateException.class,
        () -> config.corsConfigurationSource("", environment));
    assertThrows(IllegalArgumentException.class,
        () -> config.corsConfigurationSource(
            "http://example.test", environment));
    assertThrows(IllegalArgumentException.class,
        () -> config.corsConfigurationSource("*", environment));
    var source = config.corsConfigurationSource(
        "https://store.example.test", environment);
    var request = new MockHttpServletRequest("GET", "/api/categories");
    var cors = source.getCorsConfiguration(request);
    assertNotNull(cors);
    assertEquals(Boolean.TRUE, cors.getAllowCredentials());
    assertEquals("https://store.example.test",
        cors.checkOrigin("https://store.example.test"));
    assertNull(cors.checkOrigin("https://other.example.test"));
    assertThrows(IllegalArgumentException.class, () -> new AuthController(
        mock(AuthService.class), mock(RefreshSessionService.class),
        false, "Lax", environment));
  }
}

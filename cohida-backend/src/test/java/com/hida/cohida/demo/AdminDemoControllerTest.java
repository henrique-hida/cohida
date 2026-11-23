package com.hida.cohida.demo;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminDemoControllerTest {
  @Configuration
  @EnableMethodSecurity
  @Import(AdminDemoController.class)
  static class Config {
    @Bean
    DemoSeederService demoSeederService() {
      return mock(DemoSeederService.class);
    }

  }

  @AfterEach
  void clearSecurity() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void demoRequiresAdministrator() {
    try (var context = context("demo")) {
      var controller = context.getBean(AdminDemoController.class);
      SecurityContextHolder.getContext().setAuthentication(
          new TestingAuthenticationToken("user", null, "ROLE_CUSTOMER"));
      assertThrows(AccessDeniedException.class, controller::status);
      SecurityContextHolder.getContext().setAuthentication(
          new TestingAuthenticationToken("admin", null, "ROLE_ADMIN"));
      controller.status();
      verify(context.getBean(DemoSeederService.class)).isSeeded();
    }
  }

  @Test
  void productionDoesNotRegisterControllerEvenWithDemoProfile() {
    try (var context = context("demo", "prod")) {
      assertTrue(context.getBeansOfType(AdminDemoController.class).isEmpty());
    }
  }

  @Test
  void defaultProfileDoesNotRegisterController() {
    try (var context = context()) {
      assertTrue(context.getBeansOfType(AdminDemoController.class).isEmpty());
    }
  }

  private AnnotationConfigApplicationContext context(String... profiles) {
    var context = new AnnotationConfigApplicationContext();
    context.getEnvironment().setActiveProfiles(profiles);
    context.register(Config.class);
    context.refresh();
    return context;
  }
}

package com.hida.cohida.auth.config;

import jakarta.servlet.http.HttpServletResponse;
import com.hida.cohida.auth.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
    return http.csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> {})
        .exceptionHandling(errors -> errors.authenticationEntryPoint(
            (request, response, error) ->
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
        .sessionManagement(
            session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            authorize ->
                authorize
                    .requestMatchers(HttpMethod.GET, "/api/products/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/categories")
                    .permitAll()
                    .requestMatchers(
                        "/api/auth/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .httpBasic(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(
      @Value("${cohida.cors.allowed-origins:}") String allowed,
      Environment environment) {
    boolean production =
        environment.acceptsProfiles(Profiles.of("prod", "production"));
    if (production && allowed.isBlank()) {
      throw new IllegalStateException(
          "Configure as origens permitidas de CORS.");
    }
    List<String> origins = allowed.isBlank()
        ? List.of("http://localhost:5173", "http://localhost:5174",
            "http://localhost:5175", "http://127.0.0.1:5173",
            "http://127.0.0.1:5174", "http://127.0.0.1:5175")
        : java.util.Arrays.stream(allowed.split(","))
            .map(String::trim).filter(value -> !value.isEmpty())
            .distinct().toList();
    if (origins.isEmpty()) {
      throw new IllegalArgumentException("Informe uma origem CORS válida.");
    }
    for (String origin : origins) {
      var uri = java.net.URI.create(origin);
      if (uri.getHost() == null || uri.getUserInfo() != null
          || uri.getPath() == null || !uri.getPath().isEmpty()
          || uri.getQuery() != null || uri.getFragment() != null
          || !("http".equals(uri.getScheme())
              || "https".equals(uri.getScheme()))
          || (production && !"https".equals(uri.getScheme()))) {
        throw new IllegalArgumentException("Origem CORS inválida.");
      }
    }
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(origins);
    configuration.setAllowedMethods(
        List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(
        List.of("Authorization", "Content-Type", "Idempotency-Key",
            "X-Cohida-Session"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source =
        new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
  }
}

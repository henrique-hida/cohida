package com.hida.cohida.auth.controller;

import com.hida.cohida.auth.dto.AuthenticationResponse;
import com.hida.cohida.auth.dto.LoginRequest;
import com.hida.cohida.auth.dto.RegisterRequest;
import com.hida.cohida.auth.exception.InvalidCredentialsException;
import com.hida.cohida.auth.service.AuthService;
import com.hida.cohida.auth.session.RefreshSessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private static final String PREFIX = "cohida_refresh_";
  private final AuthService authService;
  private final RefreshSessionService sessions;
  private final boolean cookieSecure;
  private final String sameSite;

  public AuthController(AuthService authService, RefreshSessionService sessions,
      @Value("${cohida.auth.cookie-secure:false}") boolean cookieSecure,
      @Value("${cohida.auth.cookie-same-site:Lax}") String sameSite) {
    if (!java.util.List.of("Strict", "Lax", "None").contains(sameSite)
        || ("None".equals(sameSite) && !cookieSecure)) {
      throw new IllegalArgumentException("Configuração de cookie inválida.");
    }
    this.authService = authService;
    this.sessions = sessions;
    this.cookieSecure = cookieSecure;
    this.sameSite = sameSite;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthenticationResponse> register(
      @RequestBody RegisterRequest request) {
    return response(
        sessions.issue(authService.register(request)), HttpStatus.CREATED);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthenticationResponse> login(
      @RequestBody LoginRequest request) {
    return response(sessions.issue(authService.login(request)), HttpStatus.OK);
  }

  @PostMapping("/sessions/{id}/refresh")
  public ResponseEntity<AuthenticationResponse> refresh(@PathVariable String id,
      @RequestHeader(value = "X-Cohida-Session", required = false) String csrf,
      HttpServletRequest request) {
    requireHeader(csrf);
    return response(sessions.refresh(id, cookie(request, id)), HttpStatus.OK);
  }

  @PostMapping("/sessions/{id}/logout")
  public ResponseEntity<Void> logout(@PathVariable String id,
      @RequestHeader(value = "X-Cohida-Session", required = false) String csrf,
      HttpServletRequest request) {
    requireHeader(csrf);
    try {
      sessions.revoke(id, cookie(request, id));
    } catch (InvalidCredentialsException ignored) { }
    return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE,
        cookie(id, "", Duration.ZERO).toString()).build();
  }

  private ResponseEntity<AuthenticationResponse> response(
      RefreshSessionService.Issued issued, HttpStatus status) {
    return ResponseEntity.status(status).header(HttpHeaders.SET_COOKIE,
        cookie(issued.authentication().sessionId(), issued.secret(),
            Duration.ofDays(30)).toString()).body(issued.authentication());
  }

  private ResponseCookie cookie(String id, String value, Duration duration) {
    if (!id.matches("[0-9a-f-]{36}")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }
    return ResponseCookie.from(PREFIX + id, value).httpOnly(true)
        .secure(cookieSecure).sameSite(sameSite).path("/api/auth")
        .maxAge(duration).build();
  }

  private static String cookie(HttpServletRequest request, String id) {
    if (request.getCookies() == null) return null;
    return Arrays.stream(request.getCookies())
        .filter(cookie -> cookie.getName().equals(PREFIX + id))
        .map(Cookie::getValue).findFirst().orElse(null);
  }

  private static void requireHeader(String value) {
    if (!"1".equals(value)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
  }
}

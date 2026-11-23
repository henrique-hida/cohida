package com.hida.cohida.auth.session;

import com.hida.cohida.account.domain.Account;
import com.hida.cohida.account.repository.AccountRepository;
import com.hida.cohida.auth.dto.AuthenticationResponse;
import com.hida.cohida.auth.exception.InvalidCredentialsException;
import com.hida.cohida.auth.service.JwtService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshSessionService {
  private static final SecureRandom RANDOM = new SecureRandom();
  private final RefreshSessionRepository sessions;
  private final AccountRepository accounts;
  private final JwtService tokens;

  public RefreshSessionService(RefreshSessionRepository sessions,
      AccountRepository accounts, JwtService tokens) {
    this.sessions = sessions;
    this.accounts = accounts;
    this.tokens = tokens;
  }

  @Transactional
  public Issued issue(AuthenticationResponse authentication) {
    var principal = tokens.parse(authentication.accessToken())
        .orElseThrow(RefreshSessionService::invalid);
    Account account = accounts.findById(principal.accountId())
        .orElseThrow(RefreshSessionService::invalid);
    String id = UUID.randomUUID().toString();
    String secret = secret();
    LocalDateTime now = LocalDateTime.now();
    sessions.save(new RefreshSession(id, account, hash(secret), now,
        now.plusDays(30)));
    return new Issued(withSession(authentication, id), secret);
  }

  @Transactional
  public Issued refresh(String id, String secret) {
    RefreshSession session = valid(id, secret);
    Account account = session.account();
    if (!account.isActive()
        || (account.getCustomer() != null && !account.getCustomer().isActive())
        || (account.getAdmin() != null && !account.getAdmin().isActive())) {
      throw invalid();
    }
    String next = secret();
    session.rotate(hash(next), LocalDateTime.now());
    var customer = account.getCustomer();
    Long customerId = customer == null ? null : customer.getId();
    String name =
        customer == null ? account.getAdmin().getName() : customer.getName();
    String access = tokens.createAccessToken(
        account.getId(), customerId, account.getEmail(), account.getRole());
    return new Issued(new AuthenticationResponse(access, "Bearer",
        tokens.getAccessTokenTtlSeconds(), customerId, name,
        account.getRole().name(), id), next);
  }

  @Transactional
  public void revoke(String id, String secret) {
    valid(id, secret).revoke(LocalDateTime.now());
  }

  private RefreshSession valid(String id, String secret) {
    if (id == null || !id.matches("[0-9a-f-]{36}") || secret == null) {
      throw invalid();
    }
    var session = sessions.lock(id).orElseThrow(RefreshSessionService::invalid);
    if (!session.active(LocalDateTime.now()) || !MessageDigest.isEqual(
        session.tokenHash().getBytes(StandardCharsets.US_ASCII),
        hash(secret).getBytes(StandardCharsets.US_ASCII))) {
      throw invalid();
    }
    return session;
  }

  private static AuthenticationResponse withSession(
      AuthenticationResponse response, String id) {
    return new AuthenticationResponse(
        response.accessToken(), response.tokenType(),
        response.expiresInSeconds(),
        response.customerId(), response.customerName(),
        response.role(), id);
  }

  private static String secret() {
    byte[] random = new byte[32];
    RANDOM.nextBytes(random);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(random);
  }

  private static String hash(String secret) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(secret.getBytes(StandardCharsets.US_ASCII)));
    } catch (NoSuchAlgorithmException impossible) {
      throw new IllegalStateException(impossible);
    }
  }

  private static InvalidCredentialsException invalid() {
    return new InvalidCredentialsException("Sessão inválida ou expirada.");
  }

  public record Issued(AuthenticationResponse authentication, String secret) {}
}

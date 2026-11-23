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
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
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
  private final byte[] rotationKey;

  public RefreshSessionService(RefreshSessionRepository sessions,
      AccountRepository accounts, JwtService tokens,
      @Value("${security.jwt.secret}") String rotationKey) {
    this.sessions = sessions;
    this.accounts = accounts;
    this.tokens = tokens;
    this.rotationKey = Base64.getDecoder().decode(rotationKey);
  }

  @Transactional
  public Issued issue(AuthenticationResponse authentication) {
    var principal = tokens.parse(authentication.accessToken())
        .orElseThrow(RefreshSessionService::invalid);
    Account account = accounts.findById(principal.accountId())
        .orElseThrow(RefreshSessionService::invalid);
    String id = UUID.randomUUID().toString();
    String secret = secret();
    LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);
    sessions.save(new RefreshSession(id, account, hash(secret), now,
        now.plusDays(30)));
    return new Issued(withSession(authentication, id), secret);
  }

  @Transactional
  public Issued refresh(String id, String secret) {
    RefreshSession session = active(id, secret);
    LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);
    String suppliedHash = hash(secret);
    boolean current = equal(session.tokenHash(), suppliedHash);
    boolean previous = session.inGrace(now)
        && equal(session.previousTokenHash(), suppliedHash);
    if (!current && !previous) throw invalid();
    String next;
    if (previous) {
      next = derive(id, secret);
      if (!equal(session.tokenHash(), hash(next))) throw invalid();
    } else if (session.inGrace(now)) {
      next = secret;
    } else {
      next = derive(id, secret);
      session.rotate(hash(next), now);
    }
    Account account = session.account();
    if (!account.isActive()
        || (account.getCustomer() != null && !account.getCustomer().isActive())
        || (account.getAdmin() != null && !account.getAdmin().isActive())) {
      throw invalid();
    }
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
    var session = active(id, secret);
    String supplied = hash(secret);
    if (!equal(session.tokenHash(), supplied)
        && !(session.inGrace(LocalDateTime.now(java.time.ZoneOffset.UTC))
            && equal(session.previousTokenHash(), supplied))) throw invalid();
    session.revoke(LocalDateTime.now(java.time.ZoneOffset.UTC));
  }

  private RefreshSession active(String id, String secret) {
    if (id == null || !id.matches("[0-9a-f-]{36}") || secret == null) {
      throw invalid();
    }
    var session = sessions.lock(id).orElseThrow(RefreshSessionService::invalid);
    if (!session.active(LocalDateTime.now(java.time.ZoneOffset.UTC))) {
      throw invalid();
    }
    return session;
  }

  private static boolean equal(String left, String right) {
    return left != null && MessageDigest.isEqual(
        left.getBytes(StandardCharsets.US_ASCII),
        right.getBytes(StandardCharsets.US_ASCII));
  }

  private String derive(String id, String previous) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(rotationKey, "HmacSHA256"));
      byte[] input = ("cohida-refresh-v1:" + id + ":" + previous)
          .getBytes(StandardCharsets.US_ASCII);
      return Base64.getUrlEncoder().withoutPadding()
          .encodeToString(mac.doFinal(input));
    } catch (java.security.GeneralSecurityException failure) {
      throw new IllegalStateException(failure);
    }
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

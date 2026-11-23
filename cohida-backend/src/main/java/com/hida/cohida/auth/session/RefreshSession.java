package com.hida.cohida.auth.session;

import com.hida.cohida.account.domain.Account;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "auth_sessions")
public class RefreshSession {
  @Id @Column(length = 36) private String id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "account_id", nullable = false) private Account account;
  @Column(name = "refresh_token_hash", nullable = false, length = 64)
  private String tokenHash;
  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt;
  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;
  @Column(name = "revoked_at") private LocalDateTime revokedAt;
  @Column(name = "last_used_at") private LocalDateTime lastUsedAt;

  protected RefreshSession() {}

  public RefreshSession(String id, Account account, String hash,
      LocalDateTime now, LocalDateTime expiresAt) {
    this.id = id;
    this.account = account;
    this.tokenHash = hash;
    this.createdAt = now;
    this.expiresAt = expiresAt;
  }

  public String id() { return id; }
  public Account account() { return account; }
  public String tokenHash() { return tokenHash; }
  public boolean active(LocalDateTime now) {
    return revokedAt == null && expiresAt.isAfter(now);
  }
  public void rotate(String hash, LocalDateTime now) {
    tokenHash = hash;
    lastUsedAt = now;
  }
  public void revoke(LocalDateTime now) { revokedAt = now; }
}

package com.hida.cohida.auth.service;

import com.hida.cohida.account.enums.AccountRole;
import com.hida.cohida.auth.config.JwtProperties;
import com.hida.cohida.auth.security.AuthenticatedCustomer;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtService {
    private final JwtProperties properties;
    private final SecretKey signingKey;
    private final Clock clock;

    @Autowired
    public JwtService(JwtProperties properties) {
        this(properties, Clock.systemUTC());
    }

    JwtService(JwtProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        byte[] keyBytes = Decoders.BASE64.decode(properties.secret());
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret must be Base64-encoded and at least 256 bits");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String createAccessToken(Long accountId, Long customerId, String email, AccountRole role) {
        Instant now = clock.instant();
        return Jwts.builder()
                .issuer(properties.issuer())
                .subject(accountId.toString())
                .claim("customerId", customerId)
                .claim("email", email)
                .claim("role", role.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.accessTokenTtl())))
                .signWith(signingKey)
                .compact();
    }

    public String createAccessToken(Long customerId, String email, AccountRole role) {
        return createAccessToken(customerId, customerId, email, role);
    }

    public long getAccessTokenTtlSeconds() {
        return properties.accessTokenTtl().toSeconds();
    }

    public Optional<AuthenticatedCustomer> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(signingKey).requireIssuer(properties.issuer())
                    .build().parseSignedClaims(token).getPayload();
            Number customerId = claims.get("customerId", Number.class);
            return Optional.of(new AuthenticatedCustomer(Long.valueOf(claims.getSubject()),
                    customerId == null ? null : customerId.longValue(),
                    claims.get("email", String.class),
                    AccountRole.valueOf(claims.get("role", String.class))));
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }
}

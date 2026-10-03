package com.hida.cohida.auth.dto;

public record AuthenticationResponse(String accessToken, String tokenType, long expiresInSeconds,
                                     Long customerId, String customerName, String role) {
}

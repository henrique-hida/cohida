package com.hida.cohida.analytics.dto;

public record SalesPointResponse(String period, String category, long revenueCents, long orders) {
}

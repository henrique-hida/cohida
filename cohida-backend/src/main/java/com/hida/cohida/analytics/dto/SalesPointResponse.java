package com.hida.cohida.analytics.dto;

public record SalesPointResponse(
    String period, Long categoryId, long revenueCents, long orders) {}

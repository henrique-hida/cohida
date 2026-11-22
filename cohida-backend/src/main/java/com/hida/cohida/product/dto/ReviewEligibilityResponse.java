package com.hida.cohida.product.dto;

public record ReviewEligibilityResponse(
    boolean eligible, boolean alreadyReviewed, Long orderId) {}

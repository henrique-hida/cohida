package com.hida.cohida.product.dto;

import java.math.BigDecimal;

public record ProductReviewRequest(
    Long orderId, BigDecimal rating, String description) {}

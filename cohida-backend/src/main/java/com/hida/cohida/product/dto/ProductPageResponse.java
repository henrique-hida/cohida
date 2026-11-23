package com.hida.cohida.product.dto;

import java.util.List;

public record ProductPageResponse(
    List<ProductResponse> products, long total, int page, int size) {}

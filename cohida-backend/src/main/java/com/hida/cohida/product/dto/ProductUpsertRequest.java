package com.hida.cohida.product.dto;

import java.util.List;

public record ProductUpsertRequest(
    String name,
    String brand,
    String description,
    String imageUrl,
    List<Long> categoryIds,
    Integer minimumStock,
    Boolean active,
    List<ProductVariantRequest> variants) {}

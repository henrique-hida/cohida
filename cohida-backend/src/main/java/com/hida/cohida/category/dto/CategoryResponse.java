package com.hida.cohida.category.dto;

import com.hida.cohida.category.domain.Category;

public record CategoryResponse(Long id, String slug, String name, String description) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getSlug(), category.getName(), category.getDescription());
    }
}

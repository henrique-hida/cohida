package com.hida.cohida.category.controller;

import com.hida.cohida.category.dto.CategoryResponse;
import com.hida.cohida.cache.PublicCategoryCache;
import com.hida.cohida.category.service.CategoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
  private final CategoryService categories;
  private final PublicCategoryCache cache;

  public CategoryController(
      CategoryService categories, PublicCategoryCache cache) {
    this.categories = categories;
    this.cache = cache;
  }

  @GetMapping
  public List<CategoryResponse> findAll() {
    return cache.get(() -> categories.findAll().stream()
        .map(CategoryResponse::from).toList());
  }
}

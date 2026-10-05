package com.hida.cohida.category.controller;

import com.hida.cohida.category.dto.CategoryRequest;
import com.hida.cohida.category.dto.CategoryResponse;
import com.hida.cohida.category.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {
    private final CategoryService categories;
    public AdminCategoryController(CategoryService categories) { this.categories = categories; }
    @GetMapping public List<CategoryResponse> findAll() { return categories.findAll().stream().map(CategoryResponse::from).toList(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public CategoryResponse create(@RequestBody CategoryRequest request) { return CategoryResponse.from(categories.create(request)); }
    @PutMapping("/{id}") public CategoryResponse update(@PathVariable Long id, @RequestBody CategoryRequest request) { return CategoryResponse.from(categories.update(id, request)); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) { categories.delete(id); }
}

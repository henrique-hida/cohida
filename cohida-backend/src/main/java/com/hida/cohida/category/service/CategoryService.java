package com.hida.cohida.category.service;

import com.hida.cohida.auth.exception.ConflictException;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.category.domain.Category;
import com.hida.cohida.category.dto.CategoryRequest;
import com.hida.cohida.category.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class CategoryService {
    private final CategoryRepository categories;

    public CategoryService(CategoryRepository categories) { this.categories = categories; }

    @Transactional(readOnly = true)
    public List<Category> findAll() { return categories.findByDeletedAtIsNullOrderByNameAsc(); }

    @Transactional
    public Category create(CategoryRequest request) {
        String name = requiredName(request);
        String slug = slugify(name);
        if (categories.existsBySlug(slug)) throw new ConflictException("Já existe uma categoria com esse nome.");
        return categories.save(new Category(slug, name, description(request)));
    }

    @Transactional
    public Category update(Long id, CategoryRequest request) {
        Category category = find(id);
        category.update(requiredName(request), description(request));
        return categories.save(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = find(id);
        category.deactivate();
        categories.save(category);
    }

    private Category find(Long id) {
        return categories.findByIdAndDeletedAtIsNull(id).orElseThrow(() -> new InvalidRequestException("Categoria não encontrada."));
    }

    private static String requiredName(CategoryRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) throw new InvalidRequestException("Informe o nome da categoria.");
        return request.name().trim();
    }

    private static String description(CategoryRequest request) {
        return request.description() == null ? "" : request.description().trim();
    }

    private static String slugify(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}

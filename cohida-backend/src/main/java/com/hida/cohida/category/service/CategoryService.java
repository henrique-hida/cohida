package com.hida.cohida.category.service;

import com.hida.cohida.auth.exception.ConflictException;
import com.hida.cohida.cache.PublicCategoryCache;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.category.domain.Category;
import com.hida.cohida.category.dto.CategoryRequest;
import com.hida.cohida.category.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import com.hida.cohida.category.domain.CategorySuggestionJob;
import com.hida.cohida.category.repository.CategorySuggestionJobRepository;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class CategoryService {
  private final CategoryRepository categories;
  private final PublicCategoryCache cache;
  private final CategorySuggestionJobRepository jobs;

  public CategoryService(
      CategoryRepository categories, PublicCategoryCache cache,
      CategorySuggestionJobRepository jobs) {
    this.categories = categories;
    this.cache = cache;
    this.jobs = jobs;
  }

  @Transactional(readOnly = true)
  public List<Category> findAll() {
    return categories.findByDeletedAtIsNullOrderByNameAsc();
  }

  @Transactional
  public Category create(CategoryRequest request) {
    String name = requiredName(request);
    String slug = slugify(name);
    if (categories.existsBySlug(slug))
      throw new ConflictException("Já existe uma categoria com esse nome.");
    Category category = categories.save(
        new Category(slug, name, description(request)));
    jobs.save(new CategorySuggestionJob(category.getId()));
    invalidateAfterCommit();
    return category;
  }

  @Transactional
  public Category update(Long id, CategoryRequest request) {
    Category category = find(id);
    category.update(requiredName(request), description(request));
    categories.save(category);
    jobs.lockByCategoryId(id).ifPresent(CategorySuggestionJob::refreshPending);
    invalidateAfterCommit();
    return category;
  }

  @Transactional
  public void delete(Long id) {
    Category category = find(id);
    category.deactivate();
    categories.save(category);
    invalidateAfterCommit();
  }

  private void invalidateAfterCommit() {
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            cache.invalidate();
          }
        });
  }

  private Category find(Long id) {
    return categories
        .findByIdAndDeletedAtIsNull(id)
        .orElseThrow(
            () -> new InvalidRequestException("Categoria não encontrada."));
  }

  private static String requiredName(CategoryRequest request) {
    if (request == null || request.name() == null || request.name().isBlank())
      throw new InvalidRequestException("Informe o nome da categoria.");
    return request.name().trim();
  }

  private static String description(CategoryRequest request) {
    return request.description() == null ? "" : request.description().trim();
  }

  private static String slugify(String value) {
    return Normalizer.normalize(value, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("(^-|-$)", "");
  }
}

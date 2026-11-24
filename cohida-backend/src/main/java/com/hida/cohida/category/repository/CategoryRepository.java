package com.hida.cohida.category.repository;

import com.hida.cohida.category.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
  List<Category> findByIdInAndDeletedAtIsNull(Iterable<Long> ids);

  List<Category> findByDeletedAtIsNullOrderByNameAsc();

  Optional<Category> findByIdAndDeletedAtIsNull(Long id);

  boolean existsBySlug(String slug);

  boolean existsByIdAndDeletedAtIsNull(Long id);
}

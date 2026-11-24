package com.hida.cohida.category.repository;

import com.hida.cohida.category.domain.CategoryChatSuggestion;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryChatSuggestionRepository
    extends JpaRepository<CategoryChatSuggestion, Long> {
  List<CategoryChatSuggestion> findByCategoryIdAndActiveTrueOrderByPosition(
      long categoryId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("delete from CategoryChatSuggestion s where s.categoryId = :id")
  void deleteByCategory(@Param("id") long categoryId);
}

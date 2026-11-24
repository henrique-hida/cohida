package com.hida.cohida.category.service;

import com.hida.cohida.category.domain.Category;
import com.hida.cohida.category.domain.CategorySuggestionJob;
import com.hida.cohida.category.repository.CategoryRepository;
import com.hida.cohida.category.repository.CategorySuggestionJobRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
class CategorySuggestionJpaTest {
  @Autowired private CategoryRepository categories;
  @Autowired private CategorySuggestionJobRepository jobs;
  @Autowired private CategorySuggestionService suggestions;

  @Test
  void manualChangesReplaceQuestionsAndMarkJobAsEdited() {
    var category = categories.save(
        new Category("jpa-suggest", "Teste", "Teste"));
    jobs.saveAndFlush(new CategorySuggestionJob(category.getId()));

    var result = suggestions.save(category.getId(), List.of("Primeira?"));
    assertEquals("EDITED", result.status());
    assertEquals(List.of("Primeira?"), result.questions());

    result = suggestions.save(category.getId(), List.of("Outra?", "Mais?"));
    assertEquals(List.of("Outra?", "Mais?"), result.questions());
    assertEquals("EDITED", suggestions.details(category.getId()).status());
  }
}

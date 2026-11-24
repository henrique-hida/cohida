package com.hida.cohida.category.service;

import com.hida.cohida.category.domain.Category;
import com.hida.cohida.category.domain.CategorySuggestionJob;
import com.hida.cohida.category.repository.CategoryRepository;
import com.hida.cohida.category.repository.CategorySuggestionJobRepository;
import com.hida.cohida.category.repository.CategorySuggestionJobStore;
import com.hida.cohida.chat.service.CategoryQuestionGenerator;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
class CategorySuggestionWorkerJpaTest {
  @Autowired private CategoryRepository categories;
  @Autowired private CategorySuggestionJobRepository jobs;
  @Autowired private CategorySuggestionService suggestions;
  @MockitoBean private CategorySuggestionJobStore store;
  @MockitoBean private CategoryQuestionGenerator generator;

  @Test
  void workerPublishesFourQuestionsThroughJpa() {
    var category = categories.save(
        new Category("worker-jpa", "Corrida teste", "Descrição de teste"));
    jobs.saveAndFlush(new CategorySuggestionJob(category.getId()));
    var job = new CategorySuggestionJobStore.Job(category.getId(),
        category.getName(), category.getDescription(), UUID.randomUUID());
    var questions = List.of("Uma?", "Duas?", "Três?", "Quatro?");
    when(store.claim()).thenReturn(job);
    when(store.complete(job)).thenReturn(true);
    when(generator.generate(category.getName(), category.getDescription()))
        .thenReturn(questions);

    suggestions.process();

    assertEquals(questions, suggestions.details(category.getId()).questions());
  }

  @Test
  void staleWorkerDoesNotReplaceManuallyEditedQuestions() {
    var category = categories.save(
        new Category("stale-worker-jpa", "Categoria teste", "Descrição"));
    jobs.saveAndFlush(new CategorySuggestionJob(category.getId()));
    suggestions.save(category.getId(), List.of("Pergunta editada?"));
    var job = new CategorySuggestionJobStore.Job(category.getId(),
        category.getName(), category.getDescription(), UUID.randomUUID());
    when(store.claim()).thenReturn(job);
    when(store.complete(job)).thenReturn(false);
    when(generator.generate(category.getName(), category.getDescription()))
        .thenReturn(List.of("Uma?", "Duas?", "Três?", "Quatro?"));

    suggestions.process();

    assertEquals(List.of("Pergunta editada?"),
        suggestions.details(category.getId()).questions());
    assertEquals("EDITED", suggestions.details(category.getId()).status());
  }
}

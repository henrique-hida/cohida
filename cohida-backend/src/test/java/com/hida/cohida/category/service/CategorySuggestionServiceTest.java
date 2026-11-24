package com.hida.cohida.category.service;

import com.hida.cohida.category.repository.CategoryChatSuggestionRepository;
import com.hida.cohida.category.repository.CategoryRepository;
import com.hida.cohida.category.repository.CategorySuggestionJobRepository;
import com.hida.cohida.category.repository.CategorySuggestionJobStore;
import com.hida.cohida.chat.service.CategoryQuestionGenerator;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CategorySuggestionServiceTest {
  private final CategoryChatSuggestionRepository suggestions =
      mock(CategoryChatSuggestionRepository.class);
  private final CategorySuggestionJobStore store =
      mock(CategorySuggestionJobStore.class);
  private final CategorySuggestionJobStore.Job job =
      new CategorySuggestionJobStore.Job(
          1L, "Corrida", "Produtos para corrida", UUID.randomUUID());

  private CategorySuggestionService service(
      CategoryQuestionGenerator generator) {
    var manager = mock(PlatformTransactionManager.class);
    when(manager.getTransaction(any())).thenAnswer(
        ignored -> new SimpleTransactionStatus());
    when(store.claim()).thenReturn(job);
    return new CategorySuggestionService(store, generator, suggestions,
        mock(CategorySuggestionJobRepository.class),
        mock(CategoryRepository.class), new TransactionTemplate(manager));
  }

  @Test
  void publishesValidatedQuestionsWhenJobStillOwnedByWorker() {
    var generator = mock(CategoryQuestionGenerator.class);
    when(generator.generate("Corrida", "Produtos para corrida"))
        .thenReturn(List.of("Uma?", "Duas?", "Três?", "Quatro?"));
    when(store.complete(job)).thenReturn(true);

    service(generator).process();

    verify(suggestions).deleteByCategory(1L);
    verify(suggestions).saveAll(any());
  }

  @Test
  void recordsProviderFailureWithoutReplacingQuestions() {
    var generator = mock(CategoryQuestionGenerator.class);
    doThrow(new IllegalStateException("unavailable"))
        .when(generator).generate("Corrida", "Produtos para corrida");

    service(generator).process();

    verify(store).fail(job);
    verify(suggestions, never()).deleteByCategory(1L);
  }

  @Test
  void discardsGeneratedQuestionsWhenJobWasChangedDuringGeneration() {
    var generator = mock(CategoryQuestionGenerator.class);
    when(generator.generate("Corrida", "Produtos para corrida"))
        .thenReturn(List.of("Uma?", "Duas?", "Três?", "Quatro?"));
    when(store.complete(job)).thenReturn(false);

    service(generator).process();

    verify(suggestions, never()).deleteByCategory(1L);
  }
}

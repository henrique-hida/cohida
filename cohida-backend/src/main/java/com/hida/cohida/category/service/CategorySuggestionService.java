package com.hida.cohida.category.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.category.domain.CategoryChatSuggestion;
import com.hida.cohida.category.domain.CategorySuggestionJob;
import com.hida.cohida.category.repository.CategoryRepository;
import com.hida.cohida.category.repository.CategorySuggestionJobRepository;
import com.hida.cohida.category.repository.CategorySuggestionJobStore;
import com.hida.cohida.category.repository.CategoryChatSuggestionRepository;
import com.hida.cohida.chat.service.CategoryQuestionGenerator;
import jakarta.annotation.PreDestroy;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class CategorySuggestionService {
  private static final Logger LOG =
      LoggerFactory.getLogger(CategorySuggestionService.class);
  private final CategorySuggestionJobStore jobStore;
  private final CategoryQuestionGenerator generator;
  private final CategoryChatSuggestionRepository suggestions;
  private final CategorySuggestionJobRepository jobs;
  private final CategoryRepository categories;
  private final TransactionTemplate transactions;
  private final ExecutorService worker = Executors.newSingleThreadExecutor();
  private final AtomicBoolean running = new AtomicBoolean();
  @Value("${cohida.category-suggestions.enabled:true}")
  private boolean enabled;

  public record Details(String status, List<String> questions) {}

  public CategorySuggestionService(CategorySuggestionJobStore jobStore,
      CategoryQuestionGenerator generator,
      CategoryChatSuggestionRepository suggestions,
      CategorySuggestionJobRepository jobs, CategoryRepository categories,
      TransactionTemplate transactions) {
    this.jobStore = jobStore;
    this.generator = generator;
    this.suggestions = suggestions;
    this.jobs = jobs;
    this.categories = categories;
    this.transactions = transactions;
  }

  @Transactional(readOnly = true)
  public Details details(long id) {
    requireCategory(id);
    String status = jobs.findById(id).map(CategorySuggestionJob::status)
        .orElse("COMPLETED");
    var questions = suggestions
        .findByCategoryIdAndActiveTrueOrderByPosition(id).stream()
        .map(CategoryChatSuggestion::question).toList();
    return new Details(status, questions);
  }

  @Transactional
  public Details save(long id, List<String> questions) {
    requireCategory(id);
    if (questions == null || questions.size() > 4
        || questions.stream().anyMatch(q -> q == null || q.isBlank()
            || q.trim().length() > 240)
        || questions.stream().map(q -> q.trim().toLowerCase(
            java.util.Locale.ROOT)).distinct().count() != questions.size()) {
      throw new InvalidRequestException("Perguntas inválidas.");
    }
    var job = jobs.lockByCategoryId(id)
        .orElseGet(() -> new CategorySuggestionJob(id));
    job.edited();
    jobs.save(job);
    replace(id, questions, "ADMIN");
    return details(id);
  }

  @Transactional
  public void retry(long id) {
    requireCategory(id);
    var job = jobs.lockByCategoryId(id)
        .orElseThrow(() ->
            new InvalidRequestException("Geração não encontrada."));
    if (!job.retry())
      throw new InvalidRequestException("Não há geração com falha.");
  }

  private void requireCategory(long id) {
    if (!categories.existsByIdAndDeletedAtIsNull(id))
      throw new InvalidRequestException("Categoria não encontrada.");
  }

  private void replace(long id, List<String> questions, String origin) {
    suggestions.deleteByCategory(id);
    var replacement = new java.util.ArrayList<CategoryChatSuggestion>();
    for (int i = 0; i < questions.size(); i++) {
      replacement.add(new CategoryChatSuggestion(
          id, questions.get(i).trim(), i, origin));
    }
    suggestions.saveAll(replacement);
  }

  @Scheduled(fixedDelayString = "${cohida.category-suggestions.poll-ms:5000}")
  public void poll() {
    if (!enabled) return;
    if (!running.compareAndSet(false, true)) return;
    worker.execute(() -> {
      try {
        process();
      } catch (RuntimeException error) {
        LOG.warn("Category question queue unavailable: {}",
            error.getClass().getSimpleName());
      } finally {
        running.set(false);
      }
    });
  }

  @PreDestroy
  public void shutdown() {
    worker.shutdown();
  }

  public void process() {
    var job = transactions.execute(status -> jobStore.claim());
    if (job == null) return;
    try {
      var questions = generator.generate(job.name(), job.description());
      transactions.executeWithoutResult(status -> {
        if (jobStore.complete(job)) replace(job.id(), questions, "AI");
      });
    } catch (RuntimeException error) {
      LOG.warn("Category question generation failed: {}",
          error.getClass().getSimpleName());
      jobStore.fail(job);
    }
  }

}

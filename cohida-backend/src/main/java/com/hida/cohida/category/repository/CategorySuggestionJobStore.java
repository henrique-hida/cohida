package com.hida.cohida.category.repository;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/** Coordinates a locked claim with conditional state transitions. */
@Repository
public class CategorySuggestionJobStore {
  public record Job(long id, String name, String description, UUID token) {}

  private final CategorySuggestionJobRepository jobs;
  private final CategoryRepository categories;

  public CategorySuggestionJobStore(CategorySuggestionJobRepository jobs,
      CategoryRepository categories) {
    this.jobs = jobs;
    this.categories = categories;
  }

  public Job claim() {
    var claimed = jobs.claimNext().orElse(null);
    if (claimed == null) return null;
    var category = categories.findById(claimed.categoryId()).orElseThrow();
    UUID token = UUID.randomUUID();
    claimed.start(token);
    return new Job(category.getId(), category.getName(),
        category.getDescription(), token);
  }

  public boolean complete(Job job) {
    return jobs.complete(job.id(), job.token(), OffsetDateTime.now()) == 1;
  }

  public void fail(Job job) {
    jobs.fail(job.id(), job.token(), OffsetDateTime.now());
  }
}

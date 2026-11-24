package com.hida.cohida.category.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Atomically seeds questions without replacing administrator changes. */
@Repository
public class CategoryDemoSuggestionStore {
  private final JdbcTemplate jdbc;

  public CategoryDemoSuggestionStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public void seed(String slug, List<String> questions) {
    int prepared = jdbc.update(
        "update category_suggestion_jobs set status = 'EDITED', "
            + "token = null, updated_at = current_timestamp "
            + "where category_id = (select id from categories "
            + "where slug = ? and deleted_at is null) "
            + "and status in ('PENDING', 'PROCESSING', 'FAILED') "
            + "and not exists (select 1 from category_chat_suggestions s "
            + "where s.category_id = category_suggestion_jobs.category_id)",
        slug);
    if (prepared == 0) return;
    for (int position = 0; position < questions.size(); position++) {
      jdbc.update(
          "insert into category_chat_suggestions "
              + "(category_id, question, position, origin) "
              + "select id, ?, ?, 'DEMO' from categories c "
              + "where c.slug = ? and c.deleted_at is null "
              + "and not exists (select 1 from category_chat_suggestions s "
              + "where s.category_id = c.id and s.origin <> 'DEMO') "
              + "on conflict (category_id, position) do nothing",
          questions.get(position), position, slug);
    }
  }
}

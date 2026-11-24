package com.hida.cohida.chat.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ChatSuggestionQuery {
  private final JdbcTemplate jdbc;

  public ChatSuggestionQuery(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public List<String> findForCustomer(long customerId) {
    return jdbc.queryForList(
        "select question from (select s.question, s.position, c.name, c.id, "
            + "row_number() over (partition by s.category_id "
            + "order by s.position, s.id) as category_position "
            + "from chat_category_interests i "
            + "join categories c on c.id = i.category_id "
            + "join category_chat_suggestions s on s.category_id = c.id "
            + "where i.customer_id = ? and c.deleted_at is null "
            + "and s.active) suggestions "
            + "order by category_position, name, id", String.class, customerId)
        .stream().distinct().limit(4).toList();
  }
}

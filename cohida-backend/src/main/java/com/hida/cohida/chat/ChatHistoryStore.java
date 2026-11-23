package com.hida.cohida.chat;

import com.hida.cohida.auth.exception.ConflictException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;

/** SQL operations participate in the caller's short transaction. */
final class ChatHistoryStore {
  private final JdbcTemplate jdbc;

  ChatHistoryStore(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  List<ChatController.HistoryEntry> history(long customerId) {
    return jdbc.query(
        "select id, question, response, useful from "
            + "(select id, question, response, useful from chat_responses "
            + "where customer_id = ? order by id desc limit 50) recent "
            + "order by id",
        (rs, row) -> new ChatController.HistoryEntry(rs.getLong("id"),
            rs.getString("question"), rs.getString("response"),
            (Boolean) rs.getObject("useful")), customerId);
  }

  Map<Long, List<String>> productSlugs(
      List<ChatController.HistoryEntry> entries) {
    if (entries.isEmpty()) return Map.of();
    String placeholders = entries.stream().map(entry -> "?")
        .collect(Collectors.joining(","));
    Object[] ids = entries.stream().map(ChatController.HistoryEntry::id)
        .toArray();
    var links = jdbc.query(
        "select response_id, product_slug from chat_response_products "
            + "where response_id in (" + placeholders + ") "
            + "order by response_id, position",
        (rs, row) -> Map.entry(rs.getLong(1), rs.getString(2)), ids);
    return links.stream().collect(Collectors.groupingBy(Map.Entry::getKey,
        Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
  }

  void clear(long customerId) {
    ensureState(customerId);
    jdbc.update("update chat_state set history_revision = history_revision + 1 "
        + "where customer_id = ?", customerId);
    jdbc.update("delete from chat_responses where customer_id = ?", customerId);
  }

  void ensureState(long customerId) {
    jdbc.update("insert into chat_state (customer_id) values (?) "
        + "on conflict (customer_id) do nothing", customerId);
  }

  long revision(long customerId, boolean lock) {
    Long result = jdbc.queryForObject(
        "select history_revision from chat_state where customer_id = ?"
            + (lock ? " for update" : ""), Long.class, customerId);
    return result == null ? 0 : result;
  }

  long suggestionRevision(long customerId, boolean lock) {
    Long result = jdbc.queryForObject(
        "select suggestion_revision from chat_state where customer_id = ?"
            + (lock ? " for update" : ""), Long.class, customerId);
    return result == null ? 0 : result;
  }

  void invalidateSuggestions(long customerId) {
    ensureState(customerId);
    jdbc.update("update chat_state set suggestion_revision = "
        + "suggestion_revision + 1 where customer_id = ?", customerId);
  }

  long save(long customerId, long expectedRevision, String message,
      String content, String model, List<ChatController.ProductCard> cards) {
    if (revision(customerId, true) != expectedRevision)
      throw new ConflictException(
          "A conversa foi limpa. Envie sua mensagem novamente.");
    long id = Objects.requireNonNull(jdbc.queryForObject(
        "insert into chat_responses (customer_id, question, response, model, "
            + "created_at) values (?, ?, ?, ?, current_timestamp) returning id",
        Long.class, customerId, message, content, model),
        "Persisted chat response did not return an ID");
    for (int index = 0; index < cards.size(); index++) {
      jdbc.update("insert into chat_response_products "
          + "(response_id, product_slug, position) values (?, ?, ?)",
          id, cards.get(index).slug(), index);
    }
    return id;
  }
}

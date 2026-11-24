package com.hida.cohida.chat.repository;

import com.hida.cohida.chat.dto.ChatDtos;
import com.hida.cohida.chat.domain.ChatResponseRecord;
import com.hida.cohida.chat.domain.ChatResponseProduct;
import com.hida.cohida.auth.exception.ConflictException;
import com.hida.cohida.chat.domain.ChatState;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Repository;

/** History operations participate in the caller's short transaction. */
@Repository
public class ChatHistoryStore {
  private final ChatStateRepository states;
  private final ChatResponseRepository responses;
  private final ChatResponseProductRepository products;

  public ChatHistoryStore(ChatStateRepository states,
      ChatResponseRepository responses,
      ChatResponseProductRepository products) {
    this.states = states;
    this.responses = responses;
    this.products = products;
  }

  public List<ChatDtos.HistoryEntry> history(long customerId) {
    var entries = new java.util.ArrayList<>(
        responses.findTop50ByCustomerIdOrderByIdDesc(customerId));
    java.util.Collections.reverse(entries);
    return entries.stream().map(entry -> new ChatDtos.HistoryEntry(
        entry.id(), entry.question(), entry.response(), entry.useful()))
        .toList();
  }

  public Map<Long, List<String>> productSlugs(
      List<ChatDtos.HistoryEntry> entries) {
    if (entries.isEmpty()) return Map.of();
    var ids = entries.stream().map(ChatDtos.HistoryEntry::id).toList();
    return products.findByResponseIdInOrderByResponseIdAscPositionAsc(ids)
        .stream().collect(Collectors.groupingBy(ChatResponseProduct::responseId,
            Collectors.mapping(ChatResponseProduct::productSlug,
                Collectors.toList())));
  }

  public void clear(long customerId) {
    ensureState(customerId);
    state(customerId, true).invalidateHistory();
    responses.deleteByCustomer(customerId);
  }

  public void ensureState(long customerId) {
    states.ensureExists(customerId);
  }

  public long revision(long customerId, boolean lock) {
    return state(customerId, lock).historyRevision();
  }

  public long suggestionRevision(long customerId, boolean lock) {
    return state(customerId, lock).suggestionRevision();
  }

  public void invalidateSuggestions(long customerId) {
    ensureState(customerId);
    state(customerId, true).invalidateSuggestions();
  }

  private ChatState state(long customerId, boolean lock) {
    return (lock ? states.lockByCustomerId(customerId)
        : states.findById(customerId)).orElseThrow();
  }

  public long save(long customerId, long expectedRevision, String message,
      String content, String model, List<ChatDtos.ProductCard> cards) {
    if (revision(customerId, true) != expectedRevision)
      throw new ConflictException(
          "A conversa foi limpa. Envie sua mensagem novamente.");
    long id = responses.save(new ChatResponseRecord(
        customerId, message, content, model)).id();
    var links = new java.util.ArrayList<ChatResponseProduct>();
    for (int index = 0; index < cards.size(); index++) {
      links.add(new ChatResponseProduct(id, cards.get(index).slug(), index));
    }
    products.saveAll(links);
    return id;
  }
}

package com.hida.cohida.chat.service;

import com.hida.cohida.chat.repository.ChatCategoryInterestRepository;
import com.hida.cohida.chat.repository.ChatResponseRepository;
import com.hida.cohida.chat.repository.ChatHistoryStore;
import com.hida.cohida.chat.repository.ChatSuggestionQuery;
import com.hida.cohida.chat.repository.ChatResponseProductRepository;


import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.product.repository.ProductRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class CategoryInterestsQueryTest {
  @Test
  void returnsFourDistinctQuestionsAcrossActiveSelectedCategories() {
    var source = new DriverManagerDataSource(
        "jdbc:h2:mem:category_queries;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "sa", "");
    var jdbc = new JdbcTemplate(source);
    jdbc.execute("create table categories (id bigint primary key, "
        + "name varchar(100), deleted_at timestamp)");
    jdbc.execute("create table chat_category_interests (customer_id bigint, "
        + "category_id bigint, experience varchar(20))");
    jdbc.execute("create table category_chat_suggestions (id bigint, "
        + "category_id bigint, question varchar(240), position integer, "
        + "active boolean)");
    jdbc.update("insert into categories values (1, 'Corrida', null), "
        + "(2, 'Futebol', null), (3, 'Inativa', current_timestamp)");
    jdbc.update("insert into chat_category_interests values "
        + "(42, 1, 'Iniciante'), (42, 2, null), (42, 3, null), "
        + "(43, 3, null)");
    jdbc.update("insert into category_chat_suggestions values "
        + "(1, 1, 'Primeira?', 0, true), (2, 1, 'Terceira?', 1, true), "
        + "(3, 2, 'Segunda?', 0, true), (4, 2, 'Terceira?', 1, true), "
        + "(5, 2, 'Quarta?', 2, true), (6, 3, 'Oculta?', 0, true), "
        + "(7, 1, 'Inativa?', 2, false)");
    var service = new ChatService(
        new ChatHistoryStore(
            mock(com.hida.cohida.chat.repository.ChatStateRepository.class),
            mock(ChatResponseRepository.class),
            mock(ChatResponseProductRepository.class)),
        mock(com.hida.cohida.category.repository.CategoryRepository.class),
        mock(ChatCategoryInterestRepository.class),
        new ChatSuggestionQuery(jdbc), mock(ChatResponseRepository.class),
        mock(ChatResponseProductRepository.class), mock(OrderRepository.class),
        mock(ProductRepository.class), mock(ChatModel.class), "key", "model",
        new TransactionTemplate(mock(PlatformTransactionManager.class)));
    assertEquals(List.of("Primeira?", "Segunda?", "Terceira?", "Quarta?"),
        service.profileSuggestions(42));
    assertEquals(List.of(), service.profileSuggestions(43));
  }
}

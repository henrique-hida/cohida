package com.hida.cohida.chat.service;

import com.hida.cohida.chat.domain.ChatCategoryInterest;
import com.hida.cohida.chat.repository.ChatCategoryInterestRepository;


import com.hida.cohida.category.domain.Category;
import com.hida.cohida.category.repository.CategoryRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
class ChatCategoryInterestRepositoryTest {
  @Autowired private ChatCategoryInterestRepository interests;
  @Autowired private CategoryRepository categories;

  @Test
  void activeSelectionAndDeletionRemainScopedToCustomer() {
    var active = categories.save(new Category("jpa-active", "Ativa", "Teste"));
    var inactive = categories.save(
        new Category("jpa-inactive", "Inativa", "Teste"));
    inactive.deactivate();
    categories.saveAndFlush(inactive);
    interests.saveAllAndFlush(List.of(
        new ChatCategoryInterest(41, active, "Iniciante"),
        new ChatCategoryInterest(41, inactive, null),
        new ChatCategoryInterest(42, active, null)));

    assertEquals(1, interests.findActive(41).size());
    interests.deleteActive(41);
    assertEquals(0, interests.findActive(41).size());
    assertEquals(1, interests.findActive(42).size());
    assertEquals(2, interests.count());
  }
}

package com.hida.cohida.chat.repository;

import com.hida.cohida.chat.domain.ChatCategoryInterest;
import com.hida.cohida.chat.domain.ChatCategoryInterestId;


import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatCategoryInterestRepository
    extends JpaRepository<ChatCategoryInterest, ChatCategoryInterestId> {
  @EntityGraph(attributePaths = "category")
  @Query("select i from ChatCategoryInterest i where "
      + "i.id.customerId = :customerId and i.category.deletedAt is null "
      + "order by i.category.name, i.category.id")
  List<ChatCategoryInterest> findActive(@Param("customerId") long customerId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("delete from ChatCategoryInterest i where "
      + "i.id.customerId = :customerId and i.category.id in "
      + "(select c.id from Category c where c.deletedAt is null)")
  void deleteActive(@Param("customerId") long customerId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("delete from ChatCategoryInterest i where i.id.customerId = :id")
  void deleteByCustomer(@Param("id") long customerId);

  @Modifying(flushAutomatically = true)
  @Query(value = "insert into chat_category_interests "
      + "(customer_id, category_id) select :customer, id from categories "
      + "where id = :category and deleted_at is null "
      + "on conflict (customer_id, category_id) do nothing",
      nativeQuery = true)
  int addIfActive(@Param("customer") long customerId,
      @Param("category") long categoryId);
}

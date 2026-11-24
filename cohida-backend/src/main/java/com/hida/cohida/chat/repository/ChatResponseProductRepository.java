package com.hida.cohida.chat.repository;

import com.hida.cohida.chat.domain.ChatResponseRecord;
import com.hida.cohida.chat.domain.ChatResponseProduct;
import com.hida.cohida.chat.domain.ChatResponseProductId;


import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChatResponseProductRepository
    extends JpaRepository<ChatResponseProduct, ChatResponseProductId> {
  List<ChatResponseProduct> findByResponseIdInOrderByResponseIdAscPositionAsc(
      List<Long> responseIds);

  @Query("select p.productSlug, r.useful from ChatResponseProduct p, "
      + "ChatResponseRecord r where p.responseId = r.id "
      + "and r.customerId = :id and r.useful is not null order by r.id desc")
  List<Object[]> findFeedback(@Param("id") long customerId, Pageable page);
}

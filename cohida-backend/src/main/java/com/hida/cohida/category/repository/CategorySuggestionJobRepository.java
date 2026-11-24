package com.hida.cohida.category.repository;

import com.hida.cohida.category.domain.CategorySuggestionJob;
import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface CategorySuggestionJobRepository
    extends JpaRepository<CategorySuggestionJob, Long> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select j from CategorySuggestionJob j where j.categoryId = :id")
  Optional<CategorySuggestionJob> lockByCategoryId(@Param("id") long id);

  @Query(value = """
      select j.* from category_suggestion_jobs j
      join categories c on c.id = j.category_id
      where c.deleted_at is null and (j.status = 'PENDING' or
        (j.status = 'PROCESSING' and j.started_at <
          current_timestamp - interval '5 minutes'))
      order by j.updated_at limit 1 for update of j skip locked
      """, nativeQuery = true)
  Optional<CategorySuggestionJob> claimNext();

  @Modifying
  @Query("update CategorySuggestionJob j set j.status = 'COMPLETED', "
      + "j.token = null, j.updatedAt = :now where j.categoryId = :id "
      + "and j.status = 'PROCESSING' and j.token = :token "
      + "and exists (select c.id from Category c where c.id = :id "
      + "and c.deletedAt is null)")
  int complete(@Param("id") long id, @Param("token") UUID token,
      @Param("now") OffsetDateTime now);

  @Transactional
  @Modifying
  @Query("update CategorySuggestionJob j set j.status = 'FAILED', "
      + "j.token = null, j.updatedAt = :now "
      + "where j.categoryId = :id and j.token = :token")
  int fail(@Param("id") long id, @Param("token") UUID token,
      @Param("now") OffsetDateTime now);
}

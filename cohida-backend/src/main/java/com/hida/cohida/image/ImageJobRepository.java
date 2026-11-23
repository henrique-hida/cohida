package com.hida.cohida.image;

import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ImageJobRepository extends JpaRepository<ImageJob, String> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select job from ImageJob job where job.id = :id")
  Optional<ImageJob> lock(@Param("id") String id);

  @Query(value = """
      select * from product_image_jobs
      where processed_at is null and failed_at is null
        and (next_attempt_at is null or next_attempt_at <= :now)
        and (claimed_until is null or claimed_until <= :now)
        and (published_at is null or published_at <= :stale)
      order by created_at limit :limit for update skip locked
      """, nativeQuery = true)
  List<ImageJob> ready(@Param("now") LocalDateTime now,
      @Param("stale") LocalDateTime stale, @Param("limit") int limit);
}

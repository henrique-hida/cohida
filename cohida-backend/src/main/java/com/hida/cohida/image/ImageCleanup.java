package com.hida.cohida.image;

import com.hida.cohida.storage.S3ObjectStorage;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("${cohida.storage.enabled:false} && "
    + "${cohida.image.cleanup.enabled:false}")
public class ImageCleanup {
  private static final Logger LOG = LoggerFactory.getLogger(ImageCleanup.class);
  private static final Duration RETENTION = Duration.ofDays(7);
  private final S3ObjectStorage storage;
  private final ImageJobRepository jobs;
  private final JdbcTemplate jdbc;
  private String pendingCursor;
  private String outputCursor;

  public ImageCleanup(S3ObjectStorage storage, ImageJobRepository jobs,
      JdbcTemplate jdbc) {
    this.storage = storage;
    this.jobs = jobs;
    this.jdbc = jdbc;
  }

  @Scheduled(initialDelayString = "${cohida.image.cleanup.delay-ms:3600000}",
      fixedDelayString = "${cohida.image.cleanup.interval-ms:21600000}")
  public void clean() {
    try {
      pendingCursor = cleanPage("pending/", pendingCursor, true);
      outputCursor = cleanPage("products/", outputCursor, false);
    } catch (RuntimeException failure) {
      LOG.warn("Falha na limpeza de imagens: {}",
          failure.getClass().getSimpleName());
    }
  }

  private String cleanPage(String prefix, String cursor, boolean temporary) {
    var page = storage.list(prefix, cursor);
    for (var object : page.objects()) {
      if (object.modifiedAt().isAfter(Instant.now().minus(RETENTION))) continue;
      String name = object.key().substring(prefix.length());
      String id = temporary ? name : name.replaceFirst("\\.webp$", "");
      if (!id.matches("[0-9a-f-]{36}")) continue;
      var job = jobs.findById(id).orElse(null);
      if (job != null && !job.complete()) continue;
      if (!temporary && referenced(id)) continue;
      storage.delete(object.key());
    }
    return page.nextToken();
  }

  private boolean referenced(String id) {
    Long count = jdbc.queryForObject(
        "select count(*) from products where image_url = ?", Long.class,
        "/api/products/images/" + id + ".webp");
    return count != null && count > 0;
  }
}

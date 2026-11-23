package com.hida.cohida.image;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.storage.S3ObjectStorage;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@ConditionalOnProperty(name = "cohida.storage.enabled", havingValue = "true")
public class ImageJobService {
  private final ImageJobRepository jobs;
  private final S3ObjectStorage storage;

  public ImageJobService(ImageJobRepository jobs, S3ObjectStorage storage) {
    this.jobs = jobs;
    this.storage = storage;
  }

  @Transactional
  public String enqueue(byte[] contents, String contentType) {
    String id = UUID.randomUUID().toString();
    String key = temporaryKey(id);
    storage.put(key, contents, contentType);
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCompletion(int status) {
            if (status != STATUS_COMMITTED) {
              try { storage.delete(key); } catch (RuntimeException ignored) { }
            }
          }
        });
    jobs.save(new ImageJob(id));
    return "/api/products/images/" + id + ".webp";
  }

  @Transactional(readOnly = true)
  public String status(String id) {
    return jobs.findById(id).map(ImageJob::status)
        .orElseThrow(
            () -> new InvalidRequestException("Imagem não encontrada."));
  }

  @Transactional(readOnly = true)
  public String statusOrNull(String id) {
    return jobs.findById(id).map(ImageJob::status).orElse(null);
  }

  @Transactional
  public void retry(String id) {
    jobs.lock(id).orElseThrow(
        () -> new InvalidRequestException("Imagem não encontrada.")).retry();
  }

  @Transactional
  public String claim(String id) {
    return jobs.lock(id)
        .map(job -> job.claim(LocalDateTime.now())).orElse(null);
  }

  @Transactional
  public boolean finish(String id, String token) {
    var job = jobs.lock(id).orElse(null);
    if (job == null || !job.matches(token)) return false;
    job.processed(LocalDateTime.now());
    return true;
  }

  @Transactional
  public void fail(String id, String token, RuntimeException error) {
    jobs.lock(id).filter(job -> job.matches(token)).ifPresent(job ->
        job.failed(LocalDateTime.now(), error.getClass().getSimpleName(),
            error instanceof IllegalArgumentException));
  }

  public static String temporaryKey(String id) { return "pending/" + id; }
  public static String outputKey(String id) {
    return "products/" + id + ".webp";
  }
}

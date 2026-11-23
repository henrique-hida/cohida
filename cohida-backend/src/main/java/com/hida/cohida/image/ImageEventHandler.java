package com.hida.cohida.image;

import com.hida.cohida.storage.S3ObjectStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "cohida.storage.enabled", havingValue = "true")
public class ImageEventHandler {
  private static final Logger LOG =
      LoggerFactory.getLogger(ImageEventHandler.class);
  private final ImageJobService jobs;
  private final S3ObjectStorage storage;
  private final ImageTransformer transformer;

  public ImageEventHandler(ImageJobService jobs, S3ObjectStorage storage,
      ImageTransformer transformer) {
    this.jobs = jobs;
    this.storage = storage;
    this.transformer = transformer;
  }

  public void process(String id) {
    String token = jobs.claim(id);
    if (token == null) return;
    try {
      byte[] original = storage.get(ImageJobService.temporaryKey(id));
      byte[] webp = transformer.convert(original);
      storage.put(ImageJobService.outputKey(id), webp, "image/webp");
      if (jobs.finish(id, token)) {
        try { storage.delete(ImageJobService.temporaryKey(id)); }
        catch (RuntimeException failure) {
          LOG.warn("Falha ao remover imagem temporária {}", id);
        }
      }
    } catch (RuntimeException failure) {
      jobs.fail(id, token, failure);
      LOG.warn("Falha ao processar imagem {}: {}", id,
          failure.getClass().getSimpleName());
    }
  }
}

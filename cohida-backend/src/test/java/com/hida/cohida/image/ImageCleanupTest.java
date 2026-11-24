package com.hida.cohida.image;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.hida.cohida.storage.S3ObjectStorage;
import com.hida.cohida.product.repository.ProductRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class ImageCleanupTest {
  @Test
  void removesOnlyOldUnreferencedCompletedOrOrphanedObjects() {
    var storage = mock(S3ObjectStorage.class);
    var jobs = mock(ImageJobRepository.class);
    var products = mock(ProductRepository.class);
    var cleanup = new ImageCleanup(storage, jobs, products);
    String old = "00000000-0000-0000-0000-000000000001";
    String active = "00000000-0000-0000-0000-000000000002";
    String referenced = "00000000-0000-0000-0000-000000000003";
    String recent = "00000000-0000-0000-0000-000000000004";
    Instant expired = Instant.now().minus(Duration.ofDays(8));
    var running = mock(ImageJob.class);
    when(running.complete()).thenReturn(false);
    when(jobs.findById(active)).thenReturn(Optional.of(running));
    when(jobs.findById(old)).thenReturn(Optional.empty());
    when(jobs.findById(referenced)).thenReturn(Optional.empty());
    when(storage.list("pending/", null)).thenReturn(new S3ObjectStorage.Page(
        List.of(new S3ObjectStorage.StoredObject("pending/" + old, expired),
            new S3ObjectStorage.StoredObject("pending/" + active, expired),
            new S3ObjectStorage.StoredObject(
                "pending/" + recent, Instant.now())),
        null));
    when(storage.list("products/", null)).thenReturn(new S3ObjectStorage.Page(
        List.of(new S3ObjectStorage.StoredObject(
                "products/" + old + ".webp", expired),
            new S3ObjectStorage.StoredObject(
                "products/" + referenced + ".webp", expired)), null));
    when(products.existsByImageUrl(
        "/api/products/images/" + referenced + ".webp")).thenReturn(true);

    cleanup.clean();

    verify(storage).delete("pending/" + old);
    verify(storage).delete("products/" + old + ".webp");
    verify(storage, never()).delete("pending/" + active);
    verify(storage, never()).delete("pending/" + recent);
    verify(storage, never()).delete("products/" + referenced + ".webp");
  }
}

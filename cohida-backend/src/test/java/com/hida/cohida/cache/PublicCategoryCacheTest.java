package com.hida.cohida.cache;

import static org.junit.jupiter.api.Assertions.*;

import com.hida.cohida.category.dto.CategoryResponse;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import tools.jackson.databind.json.JsonMapper;

class PublicCategoryCacheTest {
  @Test
  @EnabledIfEnvironmentVariable(
      named = "CACHE_TEST_REDIS_PORT", matches = "[0-9]+")
  void rejectsStaleFillFromAnotherInstance() throws Exception {
    int port = Integer.parseInt(System.getenv("CACHE_TEST_REDIS_PORT"));
    String namespace = "cohida:test:" + UUID.randomUUID();
    var mapper = JsonMapper.builder().build();
    var first = new PublicCategoryCache(
        mapper, true, "127.0.0.1", port, "", false, namespace);
    var second = new PublicCategoryCache(
        mapper, true, "127.0.0.1", port, "", false, namespace);
    var old = List.of(new CategoryResponse(1L, "old", "Antiga", ""));
    var fresh = List.of(new CategoryResponse(1L, "new", "Nova", ""));
    AtomicInteger reads = new AtomicInteger();
    try {
      assertEquals(old, first.get(() -> {
        reads.incrementAndGet();
        return old;
      }));
      assertEquals(old, second.get(() -> {
        reads.incrementAndGet();
        return fresh;
      }));
      assertEquals(1, reads.get());
      second.invalidate();
      var started = new CountDownLatch(1);
      var release = new CountDownLatch(1);
      try (var executor = Executors.newSingleThreadExecutor()) {
        var pending = executor.submit(() -> first.get(() -> {
          started.countDown();
          try {
            if (!release.await(5, TimeUnit.SECONDS)) {
              throw new IllegalStateException();
            }
          } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
          }
          return old;
        }));
        assertTrue(started.await(5, TimeUnit.SECONDS));
        second.invalidate();
        release.countDown();
        assertEquals(old, pending.get(5, TimeUnit.SECONDS));
      }
      assertEquals(fresh, second.get(() -> fresh));
      assertEquals(fresh, first.get(() -> old));
    } finally {
      first.close();
      second.close();
    }
  }

  @Test
  void unavailableCacheFallsBackToLoader() {
    var cache = new PublicCategoryCache(
        JsonMapper.builder().build(), true, "127.0.0.1", 1, "", false, "test");
    var expected = List.of(new CategoryResponse(1L, "slug", "Nome", ""));
    try {
      assertEquals(expected, cache.get(() -> expected));
    } finally {
      cache.close();
    }
  }
}

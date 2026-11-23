package com.hida.cohida.cache;

import com.hida.cohida.category.dto.CategoryResponse;
import jakarta.annotation.PreDestroy;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.RedisPassword;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/** Small, optional cache for public categories, isolated from the queue. */
@Component
public class PublicCategoryCache {
  private static final Logger LOG =
      LoggerFactory.getLogger(PublicCategoryCache.class);
  private static final int MAX_BYTES = 65_536;
  @SuppressWarnings("rawtypes")
  private static final DefaultRedisScript<List> READ = new DefaultRedisScript<>(
      "local v=redis.call('hget',KEYS[1],'version'); "
          + "if not v then v=ARGV[1]; "
          + "redis.call('hset',KEYS[1],'version',v); "
          + "redis.call('expire',KEYS[1],75); end; "
          + "return {v,redis.call('hget',KEYS[1],'data') or ''}", List.class);
  private static final DefaultRedisScript<Long> STORE =
      new DefaultRedisScript<>(
      "if redis.call('hget',KEYS[1],'version')==ARGV[1] then "
          + "redis.call('hset',KEYS[1],'data',ARGV[2]); "
          + "redis.call('expire',KEYS[1],ARGV[3]); return 1; end; return 0",
      Long.class);
  private static final DefaultRedisScript<Long> INVALIDATE =
      new DefaultRedisScript<>(
          "redis.call('hset',KEYS[1],'version',ARGV[1]); "
              + "redis.call('hdel',KEYS[1],'data'); "
              + "return redis.call('expire',KEYS[1],75)", Long.class);
  private final LettuceConnectionFactory connection;
  private final StringRedisTemplate redis;
  private final JsonMapper json;
  private final String key;
  private volatile long retryAfter;

  public PublicCategoryCache(
      JsonMapper json,
      @Value("${cohida.cache.enabled:false}") boolean enabled,
      @Value("${cohida.cache.host:localhost}") String host,
      @Value("${cohida.cache.port:6379}") int port,
      @Value("${cohida.cache.password:}") String password,
      @Value("${cohida.cache.ssl:false}") boolean ssl,
      @Value("${cohida.cache.namespace:cohida:dev:v1}") String namespace) {
    this.json = json;
    key = namespace + ":categories";
    if (enabled) {
      var server = new RedisStandaloneConfiguration(host, port);
      if (!password.isBlank()) server.setPassword(RedisPassword.of(password));
      var clientOptions = ClientOptions.builder().socketOptions(
          SocketOptions.builder()
              .connectTimeout(Duration.ofMillis(250)).build())
          .build();
      var builder = LettuceClientConfiguration.builder()
          .clientOptions(clientOptions).commandTimeout(Duration.ofMillis(250));
      if (ssl) builder.useSsl();
      var options = builder.build();
      connection = new LettuceConnectionFactory(server, options);
      connection.afterPropertiesSet();
      connection.start();
      redis = new StringRedisTemplate(connection);
      redis.afterPropertiesSet();
    } else {
      connection = null;
      redis = null;
    }
  }

  public synchronized List<CategoryResponse> get(
      Supplier<List<CategoryResponse>> loader) {
    if (redis == null || System.nanoTime() < retryAfter) return loader.get();
    String version;
    try {
      List<?> entry =
          redis.execute(READ, List.of(key), UUID.randomUUID().toString());
      if (entry == null || entry.size() != 2) return loader.get();
      version = (String) entry.get(0);
      String stored = (String) entry.get(1);
      if (!stored.isEmpty() && stored.getBytes(StandardCharsets.UTF_8).length
          <= MAX_BYTES) {
        return Arrays.asList(json.readValue(stored, CategoryResponse[].class));
      }
    } catch (RuntimeException failure) {
      pause(failure);
      return loader.get();
    }
    List<CategoryResponse> result = loader.get();
    try {
      String encoded = json.writeValueAsString(result);
      if (encoded.getBytes(StandardCharsets.UTF_8).length <= MAX_BYTES) {
        long seconds = 60 + ThreadLocalRandom.current().nextLong(16);
        redis.execute(STORE, List.of(key), version, encoded,
            Long.toString(seconds));
      }
    } catch (RuntimeException failure) {
      pause(failure);
    }
    return result;
  }

  public synchronized void invalidate() {
    if (redis == null) return;
    try {
      redis.execute(INVALIDATE, List.of(key), UUID.randomUUID().toString());
      retryAfter = 0;
    } catch (RuntimeException failure) {
      pause(failure);
    }
  }

  private void pause(RuntimeException failure) {
    LOG.warn("Cache de categorias indisponível: {}",
        failure.getClass().getSimpleName());
    retryAfter = System.nanoTime() + Duration.ofSeconds(10).toNanos();
  }

  @PreDestroy
  public void close() {
    if (connection != null) connection.destroy();
  }
}

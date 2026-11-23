package com.hida.cohida.image;

import io.lettuce.core.XAutoClaimArgs;
import io.lettuce.core.cluster.api.async.RedisClusterAsyncCommands;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/** Image queue; PostgreSQL keeps the durable task and retry state. */
@Component
@ConditionalOnExpression("${cohida.queue.enabled:false} && "
    + "${cohida.storage.enabled:false}")
public class ImageQueue {
  private static final Logger LOG = LoggerFactory.getLogger(ImageQueue.class);
  private static final String STREAM = "cohida:image-events:v1";
  private static final String GROUP = "image-processing-v1";
  private static final int BATCH_SIZE = 20;
  private static final DefaultRedisScript<Long> ACK_AND_DELETE =
      new DefaultRedisScript<>(
          "local n = redis.call('XACK', KEYS[1], ARGV[1], ARGV[2]); "
              + "if n == 1 then redis.call('XDEL', KEYS[1], ARGV[2]) end; "
              + "return n", Long.class);
  private final String consumer = UUID.randomUUID().toString();
  private final StringRedisTemplate redis;
  private final ImageJobRepository events;
  private final ImageEventHandler handler;
  private final TransactionTemplate transactions;
  private boolean groupReady;
  private String claimCursor = "0-0";

  public ImageQueue(StringRedisTemplate redis,
      ImageJobRepository events, ImageEventHandler handler,
      TransactionTemplate transactions) {
    this.redis = redis;
    this.events = events;
    this.handler = handler;
    this.transactions = transactions;
  }

  @Scheduled(fixedDelayString = "${cohida.image.poll-ms:3000}")
  public void poll() {
    try {
      ensureGroup();
      publish();
      reclaim();
      var records = redis.opsForStream().read(
          Consumer.from(GROUP, consumer),
          StreamReadOptions.empty().count(BATCH_SIZE),
          StreamOffset.create(STREAM, ReadOffset.lastConsumed()));
      if (records != null) records.forEach(this::consume);
    } catch (Exception error) {
      groupReady = false;
      LOG.warn("Fila de imagens indisponível: {}",
          error.getClass().getSimpleName());
    }
  }

  private void ensureGroup() {
    if (groupReady) return;
    try {
      redis.execute((RedisCallback<Object>) connection -> connection.execute(
          "XGROUP", bytes("CREATE"), bytes(STREAM), bytes(GROUP),
          bytes("0"), bytes("MKSTREAM")));
    } catch (Exception error) {
      if (!containsBusyGroup(error)) throw error;
    }
    groupReady = true;
  }

  private void publish() {
    transactions.executeWithoutResult(status -> {
      LocalDateTime now = LocalDateTime.now();
      var batch = events.ready(
          now, now.minusMinutes(2), BATCH_SIZE);
      for (var event : batch) {
        redis.opsForStream().add(STREAM, Map.of("eventId", event.id()));
        event.published(now);
      }
    });
  }

  private void reclaim() {
    redis.execute((RedisCallback<Void>) connection -> {
      @SuppressWarnings("unchecked")
      var commands = (RedisClusterAsyncCommands<byte[], byte[]>)
          connection.getNativeConnection();
      var args = new XAutoClaimArgs<byte[]>()
          .consumer(io.lettuce.core.Consumer.from(
              bytes(GROUP), bytes(consumer)))
          .minIdleTime(Duration.ofSeconds(30)).startId(claimCursor)
          .count(BATCH_SIZE);
      try {
        var claimed = commands.xautoclaim(bytes(STREAM), args)
            .get(5, TimeUnit.SECONDS);
        claimCursor = claimed.getId();
        for (var message : claimed.getMessages()) {
          byte[] id = message.getBody().entrySet().stream()
              .filter(entry -> "eventId".equals(string(entry.getKey())))
              .map(Map.Entry::getValue).findFirst().orElse(null);
          consume(message.getId(), id == null ? null : string(id));
        }
      } catch (InterruptedException error) {
        Thread.currentThread().interrupt();
        throw new IllegalStateException("Recuperação interrompida", error);
      } catch (Exception error) {
        throw new IllegalStateException("Falha ao recuperar mensagens", error);
      }
      return null;
    });
  }

  private void consume(MapRecord<String, Object, Object> record) {
    Object id = record.getValue().get("eventId");
    consume(record.getId().getValue(), id == null ? null : id.toString());
  }

  private void consume(String recordId, String eventId) {
    if (eventId == null) {
      LOG.error("Mensagem de imagem sem identificador");
    } else {
      try {
        handler.process(eventId);
      } catch (Exception error) {
        LOG.warn("Falha ao registrar evento de imagem {}: {}", eventId,
            error.getClass().getSimpleName());
        return;
      }
    }
    redis.execute(ACK_AND_DELETE, java.util.List.of(STREAM), GROUP, recordId);
  }

  private static boolean containsBusyGroup(Throwable error) {
    for (Throwable current = error; current != null;
        current = current.getCause())
      if (current.getMessage() != null
          && current.getMessage().contains("BUSYGROUP")) return true;
    return false;
  }

  private static byte[] bytes(String value) {
    return value.getBytes(StandardCharsets.UTF_8);
  }

  private static String string(byte[] value) {
    return new String(value, StandardCharsets.UTF_8);
  }
}

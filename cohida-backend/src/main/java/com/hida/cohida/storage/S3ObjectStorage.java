package com.hida.cohida.storage;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import jakarta.annotation.PreDestroy;

@Component
@ConditionalOnProperty(name = "cohida.storage.enabled", havingValue = "true")
public class S3ObjectStorage {
  private static final int MAX_OBJECT_BYTES = 8 * 1024 * 1024;
  private final S3Client client;
  private final String bucket;
  private final boolean createBucket;
  private volatile boolean bucketReady;

  public S3ObjectStorage(
      @Value("${cohida.storage.bucket}") String bucket,
      @Value("${cohida.storage.region:sa-east-1}") String region,
      @Value("${cohida.storage.endpoint:}") String endpoint,
      @Value("${cohida.storage.access-key:}") String accessKey,
      @Value("${cohida.storage.secret-key:}") String secretKey,
      @Value("${cohida.storage.path-style:false}") boolean pathStyle,
      @Value("${cohida.storage.create-bucket:false}") boolean createBucket) {
    if (bucket.isBlank() || accessKey.isBlank() != secretKey.isBlank()) {
      throw new IllegalArgumentException("Configuração de imagens inválida.");
    }
    this.bucket = bucket;
    this.createBucket = createBucket;
    var builder = S3Client.builder().region(Region.of(region))
        .serviceConfiguration(S3Configuration.builder()
            .pathStyleAccessEnabled(pathStyle).build())
        .overrideConfiguration(ClientOverrideConfiguration.builder()
            .apiCallTimeout(Duration.ofSeconds(20))
            .apiCallAttemptTimeout(Duration.ofSeconds(8)).build());
    if (!endpoint.isBlank()) builder.endpointOverride(URI.create(endpoint));
    if (!accessKey.isBlank()) {
      builder.credentialsProvider(StaticCredentialsProvider.create(
          AwsBasicCredentials.create(accessKey, secretKey)));
    } else {
      builder.credentialsProvider(DefaultCredentialsProvider.create());
    }
    client = builder.build();
  }

  public void put(String key, byte[] bytes, String contentType) {
    ensureBucket();
    client.putObject(PutObjectRequest.builder().bucket(bucket).key(key)
        .contentType(contentType).build(), RequestBody.fromBytes(bytes));
  }

  private synchronized void ensureBucket() {
    if (!createBucket || bucketReady) return;
    try {
      client.headBucket(request -> request.bucket(bucket));
    } catch (S3Exception failure) {
      if (failure.statusCode() != 404) throw failure;
      client.createBucket(request -> request.bucket(bucket));
    }
    bucketReady = true;
  }

  public byte[] get(String key) {
    try (var stream = client.getObject(GetObjectRequest.builder()
        .bucket(bucket).key(key).build())) {
      byte[] bytes = stream.readNBytes(MAX_OBJECT_BYTES + 1);
      if (bytes.length > MAX_OBJECT_BYTES) {
        throw new IllegalStateException("Imagem excede o limite permitido.");
      }
      return bytes;
    } catch (IOException failure) {
      throw new IllegalStateException(
          "Falha ao ler imagem armazenada.", failure);
    }
  }

  public Page list(String prefix, String continuation) {
    var result = client.listObjectsV2(request -> request.bucket(bucket)
        .prefix(prefix).maxKeys(100).continuationToken(continuation));
    return new Page(result.contents().stream()
        .map(item -> new StoredObject(item.key(), item.lastModified()))
        .toList(),
        result.nextContinuationToken());
  }

  public record StoredObject(String key, Instant modifiedAt) {}
  public record Page(List<StoredObject> objects, String nextToken) {}

  public void delete(String key) {
    client.deleteObject(request -> request.bucket(bucket).key(key));
  }

  @PreDestroy
  public void close() {
    client.close();
  }
}

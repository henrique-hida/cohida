package com.hida.cohida.storage;

import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

class S3ObjectStorageTest {
  @Test
  @EnabledIfEnvironmentVariable(named = "MINIO_TEST_PORT", matches = "59000")
  void storesReadsAndDeletesObjectsInIsolatedBucket() {
    String endpoint = "http://127.0.0.1:59000";
    String bucket = "cohida-test-" + UUID.randomUUID();
    String access = "cohida_test";
    String secret = "cohida_test_password";
    try (var admin = S3Client.builder().endpointOverride(URI.create(endpoint))
        .region(Region.US_EAST_1)
        .credentialsProvider(StaticCredentialsProvider.create(
            AwsBasicCredentials.create(access, secret)))
        .serviceConfiguration(S3Configuration.builder()
            .pathStyleAccessEnabled(true).build()).build()) {
      admin.createBucket(request -> request.bucket(bucket));
      var storage = new S3ObjectStorage(
          bucket, "us-east-1", endpoint, access, secret, true, false);
      try {
        byte[] bytes = "image data".getBytes(StandardCharsets.UTF_8);
        storage.put("private/test", bytes, "image/png");
        assertArrayEquals(bytes, storage.get("private/test"));
        storage.delete("private/test");
        assertThrows(NoSuchKeyException.class,
            () -> storage.get("private/test"));
      } finally {
        storage.close();
        admin.deleteBucket(request -> request.bucket(bucket));
      }
    }
  }
}

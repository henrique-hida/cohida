package com.hida.cohida.image;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Component;

/** Converts a bounded raster image without passing user text to a shell. */
@Component
public class ImageTransformer {
  private static final long MAX_PIXELS = 25_000_000L;
  private static final int MAX_SIDE = 10_000;
  private static final int MAX_BYTES = 8 * 1024 * 1024;

  public byte[] convert(byte[] source) {
    if (source.length == 0 || source.length > MAX_BYTES) {
      throw new IllegalArgumentException("Tamanho de imagem inválido.");
    }
    Path directory = null;
    try {
      directory = Files.createTempDirectory("cohida-image-");
      Path input = directory.resolve("input");
      Path output = directory.resolve("output.webp");
      Files.write(input, source);
      String identify = run(List.of("identify", "-ping", "-format", "%m %w %h",
          input + "[0]"));
      String[] info = identify.trim().split("\\s+");
      if (info.length != 3
          || !List.of("PNG", "JPEG", "WEBP").contains(info[0])) {
        throw new IllegalArgumentException("Formato de imagem inválido.");
      }
      int width = Integer.parseInt(info[1]);
      int height = Integer.parseInt(info[2]);
      if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE
          || (long) width * height > MAX_PIXELS) {
        throw new IllegalArgumentException("Dimensões de imagem inválidas.");
      }
      run(List.of("convert", "-limit", "memory", "128MiB", "-limit", "map",
          "128MiB", "-limit", "disk", "0", "-limit", "thread", "1",
          input + "[0]", "-auto-orient", "-resize", "1600x1600>", "-strip",
          "-quality", "80", output.toString()));
      if (Files.size(output) > MAX_BYTES) {
        throw new IllegalArgumentException("Imagem processada muito grande.");
      }
      return Files.readAllBytes(output);
    } catch (IOException failure) {
      throw new IllegalStateException("Falha ao processar imagem.", failure);
    } finally {
      if (directory != null) {
        try (var files = Files.list(directory)) {
          files.forEach(path -> {
            try { Files.deleteIfExists(path); } catch (IOException ignored) { }
          });
          Files.deleteIfExists(directory);
        } catch (IOException ignored) { }
      }
    }
  }

  private static String run(List<String> command) throws IOException {
    Path output = Files.createTempFile("cohida-image-log-", ".txt");
    try {
      Process process = new ProcessBuilder(command).redirectErrorStream(true)
          .redirectOutput(output.toFile()).start();
      try {
        if (!process.waitFor(Duration.ofSeconds(20).toMillis(),
            TimeUnit.MILLISECONDS)) {
          process.destroyForcibly();
          throw new IllegalStateException("Tempo de imagem esgotado.");
        }
      } catch (InterruptedException failure) {
        process.destroyForcibly();
        Thread.currentThread().interrupt();
        throw new IllegalStateException("Processamento interrompido.", failure);
      }
      if (process.exitValue() != 0 || Files.size(output) > 4096) {
        throw new IllegalArgumentException("Imagem inválida ou não suportada.");
      }
      return Files.readString(output, StandardCharsets.UTF_8);
    } finally {
      Files.deleteIfExists(output);
    }
  }
}

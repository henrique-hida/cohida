package com.hida.cohida.product.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProductImageStorageService {
    private static final long MAX_FILE_SIZE = 8L * 1024 * 1024;
    private final Path directory;

    public ProductImageStorageService(@Value("${cohida.upload.directory:uploads/products}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidRequestException("Selecione uma foto para enviar.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidRequestException("A foto deve ter no máximo 8 MB.");
        }

        try {
            byte[] contents = file.getBytes();
            String extension = detectImageExtension(contents);
            if (extension == null) {
                throw new InvalidRequestException("Envie uma imagem PNG, JPEG ou WebP válida.");
            }

            Files.createDirectories(directory);
            String filename = UUID.randomUUID() + extension;
            Files.write(directory.resolve(filename), contents, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
            return "/api/products/images/" + filename;
        } catch (IOException exception) {
            throw new InvalidRequestException("Não foi possível salvar a foto do produto.");
        }
    }

    public Resource load(String filename) {
        if (filename == null || !filename.matches("[0-9a-fA-F-]{36}\\.(png|jpg|webp)")) {
            throw new ResponseStatusException(NOT_FOUND);
        }

        try {
            Path image = directory.resolve(filename).normalize();
            if (!image.startsWith(directory) || !Files.isRegularFile(image)) {
                throw new ResponseStatusException(NOT_FOUND);
            }
            return new UrlResource(image.toUri());
        } catch (IOException exception) {
            throw new ResponseStatusException(NOT_FOUND);
        }
    }

    public MediaType mediaType(String filename) {
        if (filename.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (filename.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    private static String detectImageExtension(byte[] bytes) {
        if (bytes.length >= 8
                && bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E
                && bytes[3] == 0x47 && bytes[4] == 0x0D && bytes[5] == 0x0A
                && bytes[6] == 0x1A && bytes[7] == 0x0A) {
            return ".png";
        }
        if (bytes.length >= 3 && bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8
                && bytes[2] == (byte) 0xFF) {
            return ".jpg";
        }
        if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F'
                && bytes[3] == 'F' && bytes[8] == 'W' && bytes[9] == 'E'
                && bytes[10] == 'B' && bytes[11] == 'P') {
            return ".webp";
        }
        return null;
    }
}

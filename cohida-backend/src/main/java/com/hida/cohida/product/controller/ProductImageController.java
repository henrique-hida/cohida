package com.hida.cohida.product.controller;

import com.hida.cohida.product.dto.ProductImageUploadResponse;
import com.hida.cohida.product.service.ProductImageStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/products/images")
public class ProductImageController {
    private final ProductImageStorageService images;

    public ProductImageController(ProductImageStorageService images) {
        this.images = images;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductImageUploadResponse> upload(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(201).body(new ProductImageUploadResponse(images.store(file)));
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> get(@PathVariable String filename) {
        return ResponseEntity.ok()
                .contentType(images.mediaType(filename))
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .body(images.load(filename));
    }
}

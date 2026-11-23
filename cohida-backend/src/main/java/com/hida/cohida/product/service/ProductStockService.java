package com.hida.cohida.product.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.exception.ProductNotFoundException;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductStockService {
  private final ProductRepository products;
  private final ProductVariantRepository variants;

  public ProductStockService(
      ProductRepository products, ProductVariantRepository variants) {
    this.products = products;
    this.variants = variants;
  }

  @Transactional
  public ProductVariant update(Long productId, Long variantId, Integer stock) {
    if (stock == null || stock < 0) {
      throw new InvalidRequestException(
          "O estoque disponível não pode ser negativo.");
    }
    if (!products.existsById(productId)) {
      throw new ProductNotFoundException(productId.toString());
    }
    ProductVariant variant = variants.findWithLockById(variantId)
        .filter(item -> item.getProduct().getId().equals(productId))
        .orElseThrow(
            () -> new ProductNotFoundException("variação " + variantId));
    variant.updateStock(stock);
    return variants.save(variant);
  }
}

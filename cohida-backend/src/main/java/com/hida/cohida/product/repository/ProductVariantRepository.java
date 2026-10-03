package com.hida.cohida.product.repository;

import com.hida.cohida.product.domain.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    boolean existsBySku(String sku);

    boolean existsBySkuAndProductIdNot(String sku, Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ProductVariant> findWithLockById(Long id);
}

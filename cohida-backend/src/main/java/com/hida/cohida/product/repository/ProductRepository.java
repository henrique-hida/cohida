package com.hida.cohida.product.repository;

import com.hida.cohida.product.domain.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @EntityGraph(attributePaths = {"variants", "categories"})
    List<Product> findByActiveTrueOrderByNameAsc();

    @EntityGraph(attributePaths = {"variants", "categories"})
    Optional<Product> findBySlugAndActiveTrue(String slug);

    @EntityGraph(attributePaths = {"variants", "categories"})
    Optional<Product> findById(Long id);

    @EntityGraph(attributePaths = {"variants", "categories"})
    List<Product> findAllByOrderByNameAsc();

    boolean existsBySlug(String slug);

    List<Product> findByNameStartingWith(String name);
}

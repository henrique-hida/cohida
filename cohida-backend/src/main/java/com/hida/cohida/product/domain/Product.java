package com.hida.cohida.product.domain;

import com.hida.cohida.common.DomainEntity;
import jakarta.persistence.*;
import lombok.Getter;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "products")
public class Product extends DomainEntity {
    @Getter
    @Column(nullable = false, unique = true, updatable = false, length = 24)
    private String code;

    @Getter
    @Column(nullable = false, unique = true, updatable = false, length = 160)
    private String slug;

    @Getter
    @Column(nullable = false, length = 160)
    private String name;

    @Getter
    @Column(nullable = false, length = 100)
    private String brand;

    @Getter
    @Column(nullable = false, length = 2000)
    private String description;

    @Getter
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Getter
    @Column(name = "minimum_stock", nullable = false)
    private int minimumStock;

    @Getter
    @Column(nullable = false)
    private boolean active;

    @Getter
    @ElementCollection
    @CollectionTable(name = "product_categories", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "category", nullable = false, length = 80)
    private Set<String> categories = new LinkedHashSet<>();

    @Getter
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variants = new java.util.ArrayList<>();

    protected Product() {
    }

    public Product(String code, String slug, String name, String brand, String description,
                   String imageUrl, int minimumStock, boolean active, Set<String> categories) {
        this.code = code;
        this.slug = slug;
        this.name = name;
        this.brand = brand;
        this.description = description;
        this.imageUrl = imageUrl;
        this.minimumStock = minimumStock;
        this.active = active;
        this.categories = new LinkedHashSet<>(categories);
    }

    public void update(String name, String brand, String description, String imageUrl, int minimumStock,
                       boolean active, Set<String> categories) {
        this.name = name;
        this.brand = brand;
        this.description = description;
        this.imageUrl = imageUrl;
        this.minimumStock = minimumStock;
        this.active = active;
        this.categories.clear();
        this.categories.addAll(categories);
    }

    public void replaceVariants(List<ProductVariant> variants) {
        this.variants.clear();
        variants.forEach(this::addVariant);
    }

    public void clearVariants() {
        variants.clear();
    }

    public void addVariant(ProductVariant variant) {
        variant.assignTo(this);
        variants.add(variant);
    }

    public void deactivate() {
        active = false;
    }

    public void activate() {
        active = true;
    }

    public void updateImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}

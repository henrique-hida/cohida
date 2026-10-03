package com.hida.cohida.product.domain;

import com.hida.cohida.common.DomainEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "product_variants")
public class ProductVariant extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Getter
    @Column(nullable = false, unique = true, length = 80)
    private String sku;

    @Getter
    @Column(nullable = false, length = 120)
    private String label;

    @Getter
    @Column(length = 80)
    private String color;

    @Getter
    @Column(length = 40)
    private String size;

    @Getter
    @Column(name = "price_cents", nullable = false)
    private long priceCents;

    @Getter
    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    protected ProductVariant() {
    }

    public ProductVariant(String sku, String label, String color, String size, long priceCents, int stockQuantity) {
        this.sku = sku;
        this.label = label;
        this.color = color;
        this.size = size;
        this.priceCents = priceCents;
        this.stockQuantity = stockQuantity;
    }

    void assignTo(Product product) {
        this.product = product;
    }

    public void updateStock(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
}

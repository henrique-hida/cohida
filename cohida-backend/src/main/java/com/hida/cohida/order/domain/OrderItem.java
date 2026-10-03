package com.hida.cohida.order.domain;

import com.hida.cohida.common.DomainEntity;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "order_items")
public class OrderItem extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private SaleOrder order;
    @Getter
    @Column(name = "variant_id", nullable = false)
    private Long variantId;
    @Getter
    @Column(name = "product_name", nullable = false, length = 160)
    private String productName;
    @Getter
    @Column(nullable = false, length = 80)
    private String sku;
    @Getter
    @Column(name = "variant_label", nullable = false, length = 120)
    private String variantLabel;
    @Getter
    @Column(name = "unit_price_cents", nullable = false)
    private long unitPriceCents;
    @Getter
    @Column(nullable = false)
    private int quantity;

    protected OrderItem() {
    }

    public OrderItem(Long variantId, String productName, String sku, String variantLabel, long unitPriceCents, int quantity) {
        this.variantId = variantId;
        this.productName = productName;
        this.sku = sku;
        this.variantLabel = variantLabel;
        this.unitPriceCents = unitPriceCents;
        this.quantity = quantity;
    }

    void assignTo(SaleOrder order) {
        this.order = order;
    }
}

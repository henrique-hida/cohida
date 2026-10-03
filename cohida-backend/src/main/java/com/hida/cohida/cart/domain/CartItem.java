package com.hida.cohida.cart.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.product.domain.ProductVariant;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "cart_items")
public class CartItem extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Getter
    private int quantity;

    protected CartItem() {
    }

    CartItem(Cart cart, ProductVariant variant, int quantity) {
        this.cart = cart;
        this.variant = variant;
        this.quantity = quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}

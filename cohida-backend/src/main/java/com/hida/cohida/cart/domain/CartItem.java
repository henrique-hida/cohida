package com.hida.cohida.cart.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.product.domain.ProductVariant;
import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;

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

    @Getter
    @Column(name = "reserved_until")
    private LocalDateTime reservedUntil;
    @Column(name = "expiry_warning_sent")
    private boolean expiryWarningSent;

    protected CartItem() {
    }

    CartItem(Cart cart, ProductVariant variant, int quantity, LocalDateTime reservedUntil) {
        this.cart = cart;
        this.variant = variant;
        this.quantity = quantity;
        this.reservedUntil = reservedUntil;
    }

    public void reserve(int quantity, LocalDateTime reservedUntil) {
        this.quantity = quantity;
        this.reservedUntil = reservedUntil;
    }

    public boolean isExpired(LocalDateTime now) { return reservedUntil != null && !reservedUntil.isAfter(now); }
    public boolean needsExpiryWarning(LocalDateTime now) { return !expiryWarningSent && reservedUntil != null && !reservedUntil.isAfter(now.plusMinutes(5)) && reservedUntil.isAfter(now); }
    public void markExpiryWarningSent() { expiryWarningSent = true; }
}

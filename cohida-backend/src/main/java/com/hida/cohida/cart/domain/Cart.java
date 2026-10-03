package com.hida.cohida.cart.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.product.domain.ProductVariant;
import jakarta.persistence.*;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "carts")
public class Cart extends DomainEntity {
    @Getter
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Getter
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    protected Cart() {
    }

    public Cart(Customer customer) {
        this.customer = customer;
    }

    public void add(ProductVariant variant, int quantity) {
        items.stream().filter(item -> item.getVariant().getId().equals(variant.getId())).findFirst()
                .ifPresentOrElse(item -> item.setQuantity(item.getQuantity() + quantity), () -> items.add(new CartItem(this, variant, quantity)));
    }

    public CartItem item(Long itemId) {
        return items.stream().filter(item -> item.getId().equals(itemId)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Item do carrinho não encontrado."));
    }

    public void remove(Long itemId) {
        items.remove(item(itemId));
    }

    public void clear() {
        items.clear();
        coupon = null;
    }

    public void applyCoupon(Coupon coupon) {
        this.coupon = coupon;
    }

    public void removeCoupon() {
        coupon = null;
    }
}

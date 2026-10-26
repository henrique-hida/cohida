package com.hida.cohida.cart.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.product.domain.ProductVariant;
import jakarta.persistence.*;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "carts")
public class Cart extends DomainEntity {
    @Getter
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    @Getter
    @ManyToMany
    @JoinTable(name = "cart_coupons", joinColumns = @JoinColumn(name = "cart_id"), inverseJoinColumns = @JoinColumn(name = "coupon_id"))
    private java.util.Set<Coupon> coupons = new java.util.LinkedHashSet<>();

    @Getter
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CartItem> items = new ArrayList<>();

    protected Cart() {
    }

    public Cart(Customer customer) {
        this.customer = customer;
    }

    public void add(ProductVariant variant, int quantity, LocalDateTime reservedUntil) {
        items.stream().filter(item -> item.getVariant().getId().equals(variant.getId())).findFirst()
                .ifPresentOrElse(item -> item.reserve(item.getQuantity() + quantity, reservedUntil), () -> items.add(new CartItem(this, variant, quantity, reservedUntil)));
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
        coupons.clear();
    }

    public List<CartItem> removeExpiredProducts(LocalDateTime now) {
        var expiredProductIds = items.stream().filter(item -> item.isExpired(now))
                .map(item -> item.getVariant().getProduct().getId()).collect(java.util.stream.Collectors.toSet());
        var expired = items.stream().filter(item -> expiredProductIds.contains(item.getVariant().getProduct().getId())).toList();
        items.removeIf(item -> expiredProductIds.contains(item.getVariant().getProduct().getId()));
        return expired;
    }

    public List<CartItem> expireAllReservations() {
        var expired = List.copyOf(items);
        items.clear();
        return expired;
    }

    public void applyCoupon(Coupon coupon) {
        if (!coupon.isReturnCredit() && coupons.stream().anyMatch(existing -> !existing.isReturnCredit()))
            throw new IllegalArgumentException("Apenas um cupom promocional pode ser utilizado por compra.");
        coupons.add(coupon);
    }

    public void removeCoupon() {
        coupons.clear();
    }

    public void removeCoupon(String code) {
        coupons.removeIf(coupon -> coupon.getCode().equalsIgnoreCase(code));
    }
}

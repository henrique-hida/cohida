package com.hida.cohida.cart.domain;

import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.product.domain.ProductVariant;
import jakarta.persistence.*;
import lombok.Getter;
import java.time.LocalDateTime;

@Entity
@Table(name = "expired_cart_items")
public class ExpiredCartItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Getter private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "customer_id") @Getter private Customer customer;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "variant_id") @Getter private ProductVariant variant;
    @Getter private int quantity;
    @Column(name = "expired_at") @Getter private LocalDateTime expiredAt;
    @Column(name = "acknowledged_at") private LocalDateTime acknowledgedAt;
    protected ExpiredCartItem() {}
    public ExpiredCartItem(Customer customer, ProductVariant variant, int quantity) { this.customer=customer; this.variant=variant; this.quantity=quantity; this.expiredAt=LocalDateTime.now(); }
    public boolean isAcknowledged() { return acknowledgedAt != null; }
    public void acknowledge() { acknowledgedAt = LocalDateTime.now(); }
}

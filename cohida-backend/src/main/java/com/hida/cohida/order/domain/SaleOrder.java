package com.hida.cohida.order.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.customer.domain.Customer;
import jakarta.persistence.*;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class SaleOrder extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    @Getter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private OrderStatus status;
    @Getter
    @Column(name = "subtotal_cents", nullable = false)
    private long subtotalCents;
    @Getter
    @Column(name = "discount_cents", nullable = false)
    private long discountCents;
    @Getter
    @Column(name = "shipping_cents", nullable = false)
    private long shippingCents;
    @Getter
    @Column(name = "total_cents", nullable = false)
    private long totalCents;
    @Getter
    @Column(name = "coupon_code", length = 50)
    private String couponCode;
    @Getter
    @Column(name = "card_brand", nullable = false, length = 40)
    private String cardBrand;
    @Getter
    @Column(name = "card_last_digits", nullable = false, length = 4)
    private String cardLastDigits;
    @Getter
    @Column(name = "delivery_label", nullable = false, length = 80)
    private String deliveryLabel;
    @Getter
    @Column(name = "delivery_street", nullable = false, length = 160)
    private String deliveryStreet;
    @Getter
    @Column(name = "delivery_number", nullable = false, length = 20)
    private String deliveryNumber;
    @Getter
    @Column(name = "delivery_neighborhood", nullable = false, length = 100)
    private String deliveryNeighborhood;
    @Getter
    @Column(name = "delivery_zip_code", nullable = false, length = 8)
    private String deliveryZipCode;
    @Getter
    @Column(name = "delivery_city", nullable = false, length = 100)
    private String deliveryCity;
    @Getter
    @Column(name = "delivery_state", nullable = false, length = 2)
    private String deliveryState;
    @Getter
    @Column(name = "delivery_country", nullable = false, length = 80)
    private String deliveryCountry;
    @Getter
    @Column(name = "tracking_code", length = 100)
    private String trackingCode;
    @Getter
    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;
    @Getter
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    protected SaleOrder() {
    }

    public SaleOrder(Customer customer, long subtotal, long discount, long shipping, String couponCode, String cardBrand,
                     String cardLastDigits, String label, String street, String number, String neighborhood, String zip,
                     String city, String state, String country) {
        this.customer = customer;
        this.status = OrderStatus.EM_ABERTO;
        this.subtotalCents = subtotal;
        this.discountCents = discount;
        this.shippingCents = shipping;
        this.totalCents = subtotal - discount + shipping;
        this.couponCode = couponCode;
        this.cardBrand = cardBrand;
        this.cardLastDigits = cardLastDigits;
        this.deliveryLabel = label;
        this.deliveryStreet = street;
        this.deliveryNumber = number;
        this.deliveryNeighborhood = neighborhood;
        this.deliveryZipCode = zip;
        this.deliveryCity = city;
        this.deliveryState = state;
        this.deliveryCountry = country;
    }

    public void addItem(OrderItem item) {
        item.assignTo(this);
        items.add(item);
    }

    public void changeStatus(OrderStatus next) {
        if (next.ordinal() != status.ordinal() + 1)
            throw new IllegalArgumentException("A transição de status do pedido é inválida.");
        status = next;
    }

    public void dispatch(String trackingCode) {
        if (status != OrderStatus.PAGAMENTO_REALIZADO)
            throw new IllegalArgumentException("O pedido precisa ter pagamento realizado para despacho.");
        this.trackingCode = trackingCode;
        status = OrderStatus.EM_TRANSITO;
    }

    public void cancel(String reason) {
        if (status != OrderStatus.EM_ABERTO && status != OrderStatus.EM_PROCESSAMENTO)
            throw new IllegalArgumentException("Este pedido não pode mais ser cancelado.");
        status = OrderStatus.CANCELADO;
        cancellationReason = reason;
    }
}

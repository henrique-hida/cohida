package com.hida.cohida.returnrequest.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.SaleOrder;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "return_requests")
public class ReturnRequest extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;
    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private SaleOrder order;
    @Getter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReturnStatus status;
    @Getter
    @Column(nullable = false, length = 1000)
    private String reason;
    @Getter
    @Column(name = "tracking_code", length = 100)
    private String trackingCode;
    @Getter
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_coupon_id", unique = true)
    private Coupon issuedCoupon;
    @Getter
    @Column(name = "restock_items")
    private Boolean restockItems;

    protected ReturnRequest() {
    }

    public ReturnRequest(OrderItem item, String reason) {
        orderItem = item;
        order = item.getOrder();
        this.reason = reason;
        status = ReturnStatus.EM_TROCA;
    }

    public ReturnRequest(SaleOrder order, String reason) {
        this.order = order;
        this.reason = reason;
        status = ReturnStatus.EM_TROCA;
    }

    public void changeStatus(ReturnStatus next) {
        if (status == ReturnStatus.EM_TROCA && (next == ReturnStatus.TROCA_AUTORIZADA || next == ReturnStatus.TROCA_NEGADA)) {
            status = next;
            return;
        }
        throw new IllegalArgumentException("A transição da devolução é inválida.");
    }

    public void issue(Coupon coupon, boolean restockItems) {
        issuedCoupon = coupon;
        this.restockItems = restockItems;
        status = ReturnStatus.TROCADO;
    }

    public SaleOrder targetOrder() { return orderItem == null ? order : orderItem.getOrder(); }

    public java.util.List<OrderItem> targetItems() { return orderItem == null ? order.getItems() : java.util.List.of(orderItem); }
}

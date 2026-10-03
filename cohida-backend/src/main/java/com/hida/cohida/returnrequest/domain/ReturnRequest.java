package com.hida.cohida.returnrequest.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.order.domain.OrderItem;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "return_requests")
public class ReturnRequest extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;
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

    protected ReturnRequest() {
    }

    public ReturnRequest(OrderItem item, String reason) {
        orderItem = item;
        this.reason = reason;
        status = ReturnStatus.SOLICITADA;
    }

    public void changeStatus(ReturnStatus next) {
        if (status == ReturnStatus.SOLICITADA && (next == ReturnStatus.ACEITA || next == ReturnStatus.NEGADA)) {
            status = next;
            return;
        }
        if (status == ReturnStatus.ITEM_ENVIADO && next == ReturnStatus.ITEM_RECEBIDO) {
            status = next;
            return;
        }
        throw new IllegalArgumentException("A transição da devolução é inválida.");
    }

    public void dispatch(String code) {
        if (status != ReturnStatus.ACEITA)
            throw new IllegalArgumentException("A devolução precisa ser aceita antes do envio.");
        trackingCode = code;
        status = ReturnStatus.ITEM_ENVIADO;
    }

    public void issue(Coupon coupon) {
        issuedCoupon = coupon;
        status = ReturnStatus.PROCESSADA;
    }
}

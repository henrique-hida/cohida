package com.hida.cohida.order.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.paymentcard.domain.PaymentCard;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Getter;

@Entity
@Table(name = "order_payments")
public class OrderPayment extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private SaleOrder order;

    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_card_id", nullable = false)
    private PaymentCard paymentCard;

    @Getter
    @Column(name = "amount_cents", nullable = false)
    private long amountCents;

    @Getter
    @Column(name = "payment_position", nullable = false)
    private int paymentPosition;

    protected OrderPayment() {
    }

    OrderPayment(SaleOrder order, PaymentCard paymentCard, long amountCents, int paymentPosition) {
        this.order = order;
        this.paymentCard = paymentCard;
        this.amountCents = amountCents;
        this.paymentPosition = paymentPosition;
    }
}

package com.hida.cohida.coupon.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.customer.domain.Customer;
import jakarta.persistence.*;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
public class Coupon extends DomainEntity {
    @Getter
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Getter
    @Column(nullable = false, length = 500)
    private String description;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false, length = 20)
    private CouponDiscountType discountType;

    @Getter
    @Column(name = "discount_cents")
    private Long discountCents;

    @Getter
    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Getter
    @Column(name = "maximum_discount_cents")
    private Long maximumDiscountCents;

    @Getter
    @Column(name = "minimum_order_value_cents")
    private Long minimumOrderValueCents;

    @Getter
    @Column(name = "valid_from", nullable = false)
    private LocalDateTime validFrom;

    @Getter
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Getter
    @Column(name = "maximum_uses")
    private Integer maximumUses;

    @Getter
    @Column(name = "redeemed_count", nullable = false)
    private int redeemedCount;

    @Getter
    @Column(nullable = false)
    private boolean active;

    @Getter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private CouponOrigin origin = CouponOrigin.ADMIN;
    @Getter
    @Column(name = "remaining_credit_cents")
    private Long remainingCreditCents;
    @Getter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_customer_id")
    private Customer assignedCustomer;

    protected Coupon() {
    }

    public Coupon(String code, String description, CouponDiscountType discountType, Long discountCents,
                  BigDecimal discountPercentage, Long maximumDiscountCents, Long minimumOrderValueCents,
                  LocalDateTime validFrom, LocalDateTime expiresAt, Integer maximumUses, boolean active) {
        update(code, description, discountType, discountCents, discountPercentage, maximumDiscountCents,
                minimumOrderValueCents, validFrom, expiresAt, maximumUses, active);
    }

    public void update(String code, String description, CouponDiscountType discountType, Long discountCents,
                       BigDecimal discountPercentage, Long maximumDiscountCents, Long minimumOrderValueCents,
                       LocalDateTime validFrom, LocalDateTime expiresAt, Integer maximumUses, boolean active) {
        this.code = code;
        this.description = description;
        this.discountType = discountType;
        this.discountCents = discountCents;
        this.discountPercentage = discountPercentage;
        this.maximumDiscountCents = maximumDiscountCents;
        this.minimumOrderValueCents = minimumOrderValueCents;
        this.validFrom = validFrom;
        this.expiresAt = expiresAt;
        this.maximumUses = maximumUses;
        this.active = active;
    }

    public boolean isCurrentlyValid(LocalDateTime now) {
        return active && !now.isBefore(validFrom) && now.isBefore(expiresAt)
                && (maximumUses == null || redeemedCount < maximumUses)
                && (origin != CouponOrigin.RETURN || remainingCreditCents != null && remainingCreditCents > 0);
    }

    public void deactivate() {
        active = false;
    }

    public void activate() {
        active = true;
    }

    public void registerRedemption() {
        redeemedCount++;
    }

    public void revertRedemption() {
        if (redeemedCount > 0) redeemedCount--;
    }

    public boolean isAvailableTo(Long customerId) {
        return assignedCustomer == null || assignedCustomer.getId().equals(customerId);
    }

    public boolean isReturnCredit() {
        return origin == CouponOrigin.RETURN;
    }

    public void consumeCredit(long value) {
        remainingCreditCents = Math.max(0, remainingCreditCents - value);
        redeemedCount++;
    }

    public void restoreCredit(long value) {
        remainingCreditCents += value;
        if (redeemedCount > 0) redeemedCount--;
    }

    public static Coupon returnCredit(String code, Customer customer, long credit) {
        Coupon coupon = new Coupon(code, "Crédito de devolução", CouponDiscountType.FIXED_AMOUNT, credit, null, null, null, LocalDateTime.now(), LocalDateTime.now().plusYears(1), null, true);
        coupon.origin = CouponOrigin.RETURN;
        coupon.remainingCreditCents = credit;
        coupon.assignedCustomer = customer;
        return coupon;
    }
}

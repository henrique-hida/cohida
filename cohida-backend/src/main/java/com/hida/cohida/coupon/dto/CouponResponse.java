package com.hida.cohida.coupon.dto;

import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.domain.CouponDiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CouponResponse(
        Long id,
        String code,
        String description,
        CouponDiscountType discountType,
        Long discountCents,
        BigDecimal discountPercentage,
        Long maximumDiscountCents,
        Long minimumOrderValueCents,
        LocalDateTime validFrom,
        LocalDateTime expiresAt,
        Integer maximumUses,
        int redeemedCount,
        boolean active,
        boolean currentlyValid,
        com.hida.cohida.coupon.domain.CouponOrigin origin,
        Long remainingCreditCents,
        LocalDateTime createdAt
) {
    public static CouponResponse from(Coupon coupon) {
        return new CouponResponse(coupon.getId(), coupon.getCode(), coupon.getDescription(), coupon.getDiscountType(),
                coupon.getDiscountCents(), coupon.getDiscountPercentage(), coupon.getMaximumDiscountCents(),
                coupon.getMinimumOrderValueCents(), coupon.getValidFrom(), coupon.getExpiresAt(), coupon.getMaximumUses(),
                coupon.getRedeemedCount(), coupon.isActive(), coupon.isCurrentlyValid(LocalDateTime.now()),
                coupon.getOrigin(), coupon.getRemainingCreditCents(), coupon.getCreatedAt());
    }
}

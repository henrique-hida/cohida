package com.hida.cohida.coupon.dto;

import com.hida.cohida.coupon.domain.CouponDiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CouponUpsertRequest(
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
        Boolean active
) {
}

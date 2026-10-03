package com.hida.cohida.coupon.service;

import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.domain.CouponDiscountType;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CouponServiceTest {
    @Autowired
    private CouponService coupons;

    @Test
    void createsUpdatesAndDeactivatesPercentageCoupon() {
        Coupon created = coupons.create(request("BEMVINDO10", new BigDecimal("10.00"), 2_000L));

        assertEquals(CouponDiscountType.PERCENTAGE, created.getDiscountType());
        assertEquals("BEMVINDO10", created.getCode());
        assertTrue(created.isCurrentlyValid(LocalDateTime.now()));

        Coupon updated = coupons.update(created.getId(), request("BEMVINDO15", new BigDecimal("15.00"), 3_000L));
        assertEquals("BEMVINDO15", updated.getCode());
        assertEquals(new BigDecimal("15.00"), updated.getDiscountPercentage());

        coupons.deactivate(created.getId());
        assertFalse(coupons.findById(created.getId()).isCurrentlyValid(LocalDateTime.now()));
    }

    private static CouponUpsertRequest request(String code, BigDecimal percentage, long maximumDiscountCents) {
        LocalDateTime now = LocalDateTime.now();
        return new CouponUpsertRequest(code, "Desconto de boas-vindas", CouponDiscountType.PERCENTAGE, null,
                percentage, maximumDiscountCents, 10_000L, now.minusMinutes(1), now.plusDays(7), 20, true);
    }
}

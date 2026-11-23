package com.hida.cohida.demo;

import com.hida.cohida.coupon.domain.CouponDiscountType;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

final class DemoCouponFixtures {
  private DemoCouponFixtures() {}

  static List<CouponUpsertRequest> coupons() {
    LocalDateTime now = LocalDateTime.now();
    return List.of(
        new CouponUpsertRequest(
            "DEMO-10",
            "10% de desconto",
            CouponDiscountType.PERCENTAGE,
            null,
            new BigDecimal("10"),
            3000L,
            10000L,
            now.minusMinutes(1),
            now.plusMonths(3),
            100,
            true),
        new CouponUpsertRequest(
            "DEMO-20",
            "20% de desconto em pedidos acima de R$ 250",
            CouponDiscountType.PERCENTAGE,
            null,
            new BigDecimal("20"),
            6000L,
            25000L,
            now.minusMinutes(1),
            now.plusMonths(2),
            50,
            true),
        new CouponUpsertRequest(
            "DEMO-FRETE",
            "Frete de R$ 15",
            CouponDiscountType.FIXED_AMOUNT,
            1500L,
            null,
            null,
            12000L,
            now.minusMinutes(1),
            now.plusMonths(1),
            100,
            true));
  }

}

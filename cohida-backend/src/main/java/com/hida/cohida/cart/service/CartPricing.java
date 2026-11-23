package com.hida.cohida.cart.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.cart.domain.Cart;
import com.hida.cohida.coupon.domain.Coupon;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

/** Computes the cart discount without mutating cart or coupon state. */
@Component
public class CartPricing {
  public long couponValue(Cart cart, LocalDateTime now) {
    long subtotal = cart.getItems().stream()
        .mapToLong(item -> item.getVariant().getPriceCents()
            * item.getQuantity())
        .sum();
    return cart.getCoupons().stream()
        .mapToLong(coupon -> couponValue(coupon, subtotal, now)).sum();
  }

  private long couponValue(Coupon coupon, long subtotal, LocalDateTime now) {
    if (!coupon.isCurrentlyValid(now))
      throw new InvalidRequestException("O cupom não está mais válido.");
    if (coupon.getMinimumOrderValueCents() != null
        && subtotal < coupon.getMinimumOrderValueCents())
      throw new InvalidRequestException(
          "O valor mínimo do cupom não foi atingido.");
    long value = coupon.isReturnCredit() ? coupon.getRemainingCreditCents()
        : coupon.getDiscountCents() == null
            ? BigDecimal.valueOf(subtotal)
                .multiply(coupon.getDiscountPercentage())
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN)
                .longValue()
            : coupon.getDiscountCents();
    return coupon.getMaximumDiscountCents() == null ? value
        : Math.min(value, coupon.getMaximumDiscountCents());
  }
}

package com.hida.cohida.coupon.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.coupon.dto.CouponResponse;
import com.hida.cohida.coupon.repository.CouponRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/customers/me/coupons")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerCouponController {
    private final CouponRepository coupons;

    public CustomerCouponController(CouponRepository coupons) {
        this.coupons = coupons;
    }

    @GetMapping
    public List<CouponResponse> list(@AuthenticationPrincipal AuthenticatedCustomer principal) {
        LocalDateTime now = LocalDateTime.now();
        return coupons.findAvailableToCustomer(principal.customerId())
                .stream()
                .filter(coupon -> coupon.isCurrentlyValid(now))
                .map(CouponResponse::from)
                .toList();
    }
}

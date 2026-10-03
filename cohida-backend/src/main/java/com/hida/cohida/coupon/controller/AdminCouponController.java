package com.hida.cohida.coupon.controller;

import com.hida.cohida.coupon.dto.CouponResponse;
import com.hida.cohida.coupon.dto.CouponUpsertRequest;
import com.hida.cohida.coupon.service.CouponService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {
    private final CouponService coupons;

    public AdminCouponController(CouponService coupons) {
        this.coupons = coupons;
    }

    @GetMapping
    public List<CouponResponse> findAll() {
        return coupons.findAll().stream().map(CouponResponse::from).toList();
    }

    @GetMapping("/{id}")
    public CouponResponse findById(@PathVariable Long id) {
        return CouponResponse.from(coupons.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CouponResponse create(@RequestBody CouponUpsertRequest request) {
        return CouponResponse.from(coupons.create(request));
    }

    @PutMapping("/{id}")
    public CouponResponse update(@PathVariable Long id, @RequestBody CouponUpsertRequest request) {
        return CouponResponse.from(coupons.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) {
        coupons.deactivate(id);
    }
}

package com.hida.cohida.cart.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.cart.dto.AddCartItemRequest;
import com.hida.cohida.cart.dto.ApplyCouponRequest;
import com.hida.cohida.cart.dto.CartResponse;
import com.hida.cohida.cart.dto.UpdateCartItemRequest;
import com.hida.cohida.cart.service.CartService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers/me/cart")
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {
    private final CartService carts;

    public CartController(CartService carts) {
        this.carts = carts;
    }

    @GetMapping
    public CartResponse view(@AuthenticationPrincipal AuthenticatedCustomer p) {
        return carts.view(p.customerId());
    }

    @PostMapping("/items")
    public CartResponse add(@AuthenticationPrincipal AuthenticatedCustomer p, @RequestBody AddCartItemRequest r) {
        return carts.add(p.customerId(), r.variantId(), r.quantity());
    }

    @PatchMapping("/items/{itemId}")
    public CartResponse update(@AuthenticationPrincipal AuthenticatedCustomer p, @PathVariable Long itemId, @RequestBody UpdateCartItemRequest r) {
        return carts.update(p.customerId(), itemId, r.quantity());
    }

    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AuthenticatedCustomer p, @PathVariable Long itemId) {
        carts.remove(p.customerId(), itemId);
    }

    @PostMapping("/coupon")
    public CartResponse coupon(@AuthenticationPrincipal AuthenticatedCustomer p, @RequestBody ApplyCouponRequest r) {
        return carts.applyCoupon(p.customerId(), r.code());
    }

    @DeleteMapping("/coupon")
    public CartResponse removeCoupon(@AuthenticationPrincipal AuthenticatedCustomer p) {
        return carts.removeCoupon(p.customerId());
    }

    @DeleteMapping
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void clear(@AuthenticationPrincipal AuthenticatedCustomer p) {
        carts.clear(p.customerId());
    }
}

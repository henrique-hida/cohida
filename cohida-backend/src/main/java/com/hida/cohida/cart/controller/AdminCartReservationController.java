package com.hida.cohida.cart.controller;

import com.hida.cohida.cart.service.CartService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/cart-reservations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCartReservationController {
    private final CartService carts;

    public AdminCartReservationController(CartService carts) {
        this.carts = carts;
    }

    @PostMapping("/expire")
    public Map<String, Integer> expireAll() {
        return Map.of("expiredItems", carts.expireAllReservations());
    }
}

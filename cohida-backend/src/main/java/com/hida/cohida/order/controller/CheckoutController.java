package com.hida.cohida.order.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.order.dto.CheckoutRequest;
import com.hida.cohida.order.dto.OrderResponse;
import com.hida.cohida.order.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers/me/checkout")
@PreAuthorize("hasRole('CUSTOMER')")
public class CheckoutController {
    private final OrderService orders;

    public CheckoutController(OrderService orders) {
        this.orders = orders;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse checkout(@AuthenticationPrincipal AuthenticatedCustomer p, @RequestBody CheckoutRequest request) {
        if (request.payments() != null && !request.payments().isEmpty())
            return OrderResponse.from(orders.checkout(p.customerId(), request.deliveryAddressId(), request.payments()));
        return OrderResponse.from(orders.checkout(p.customerId(), request.deliveryAddressId(), request.paymentCardId()));
    }
}

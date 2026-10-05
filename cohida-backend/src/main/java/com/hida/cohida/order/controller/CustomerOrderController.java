package com.hida.cohida.order.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.order.dto.OrderResponse;
import com.hida.cohida.order.service.OrderService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/me/orders")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerOrderController {
    private final OrderService orders;

    public CustomerOrderController(OrderService orders) {
        this.orders = orders;
    }

    @GetMapping
    public List<OrderResponse> list(@AuthenticationPrincipal AuthenticatedCustomer p) {
        return orders.customerOrders(p.customerId()).stream().map(OrderResponse::from).toList();
    }

    @GetMapping("/{id}")
    public OrderResponse detail(@AuthenticationPrincipal AuthenticatedCustomer p, @PathVariable Long id) {
        return OrderResponse.from(orders.customerOrder(p.customerId(), id));
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@AuthenticationPrincipal AuthenticatedCustomer p, @PathVariable Long id, @RequestBody com.hida.cohida.order.dto.CancellationRequest request) {
        return OrderResponse.from(orders.cancel(p.customerId(), id, request.reason()));
    }

    @PostMapping("/{id}/confirm-receipt")
    public OrderResponse confirmReceipt(@AuthenticationPrincipal AuthenticatedCustomer p, @PathVariable Long id) {
        return OrderResponse.from(orders.confirmReceipt(p.customerId(), id));
    }
}

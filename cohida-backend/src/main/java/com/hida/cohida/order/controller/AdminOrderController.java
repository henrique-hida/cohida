package com.hida.cohida.order.controller;

import com.hida.cohida.order.dto.DispatchRequest;
import com.hida.cohida.order.dto.OrderResponse;
import com.hida.cohida.order.dto.OrderStatusUpdateRequest;
import com.hida.cohida.order.service.OrderService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {
    private final OrderService orders;

    public AdminOrderController(OrderService orders) {
        this.orders = orders;
    }

    @GetMapping
    public List<OrderResponse> list() {
        return orders.adminOrders().stream().map(OrderResponse::from).toList();
    }

    @GetMapping("/{id}")
    public OrderResponse detail(@PathVariable Long id) {
        return OrderResponse.from(orders.adminOrder(id));
    }

    @PatchMapping("/{id}/status")
    public OrderResponse status(@PathVariable Long id, @RequestBody OrderStatusUpdateRequest request) {
        return OrderResponse.from(orders.changeStatus(id, request.status()));
    }

    @PostMapping("/{id}/dispatch")
    public OrderResponse dispatch(@PathVariable Long id, @RequestBody DispatchRequest request) {
        return OrderResponse.from(orders.dispatch(id, request.trackingCode()));
    }
}

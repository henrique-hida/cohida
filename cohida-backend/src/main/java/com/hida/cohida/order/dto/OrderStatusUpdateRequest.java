package com.hida.cohida.order.dto;

import com.hida.cohida.order.domain.OrderStatus;

public record OrderStatusUpdateRequest(OrderStatus status) {
}

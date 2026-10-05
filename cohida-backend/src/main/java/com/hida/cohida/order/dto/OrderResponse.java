package com.hida.cohida.order.dto;

import com.hida.cohida.order.domain.SaleOrder;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

public record OrderResponse(Long id, Long customerId, String customerName,
                            com.hida.cohida.order.domain.OrderStatus status,
                            List<OrderItemResponse> items, long subtotalCents, long discountCents, long shippingCents,
                            long totalCents, String couponCode, String cardBrand, String cardLastDigits,
                            List<OrderPaymentResponse> payments, String issuedCouponCode,
                            Long issuedCouponValueCents,
                            String deliveryLabel,
                            String deliveryStreet, String deliveryNumber, String deliveryNeighborhood,
                            String deliveryZipCode,
                            String deliveryCity, String deliveryState, String deliveryCountry,
                            LocalDateTime createdAt) {
    public static OrderResponse from(SaleOrder order) {
        return new OrderResponse(order.getId(), order.getCustomer().getId(), order.getCustomer().getName(), order.getStatus(), order.getItems().stream().map(OrderItemResponse::from).toList(), order.getSubtotalCents(), order.getDiscountCents(), order.getShippingCents(), order.getTotalCents(), order.getCouponCode(), order.getCardBrand(), order.getCardLastDigits(), order.getPayments().stream().sorted(Comparator.comparingInt(com.hida.cohida.order.domain.OrderPayment::getPaymentPosition)).map(OrderPaymentResponse::from).toList(), order.getIssuedCoupon() == null ? null : order.getIssuedCoupon().getCode(), order.getIssuedCoupon() == null ? null : order.getIssuedCoupon().getRemainingCreditCents(), order.getDeliveryLabel(), order.getDeliveryStreet(), order.getDeliveryNumber(), order.getDeliveryNeighborhood(), order.getDeliveryZipCode(), order.getDeliveryCity(), order.getDeliveryState(), order.getDeliveryCountry(), order.getCreatedAt());
    }
}

package com.hida.cohida.returnrequest.dto;

import com.hida.cohida.returnrequest.domain.ReturnRequest;
import com.hida.cohida.returnrequest.domain.ReturnStatus;

public record ReturnResponse(Long id, Long orderItemId, Long orderId, ReturnStatus status, String reason,
                             String trackingCode, String couponCode) {
    public static ReturnResponse from(ReturnRequest r) {
        return new ReturnResponse(r.getId(), r.getOrderItem().getId(), r.getOrderItem().getOrder().getId(), r.getStatus(), r.getReason(), r.getTrackingCode(), r.getIssuedCoupon() == null ? null : r.getIssuedCoupon().getCode());
    }
}

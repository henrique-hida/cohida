package com.hida.cohida.returnrequest.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.returnrequest.dto.CreateReturnRequest;
import com.hida.cohida.returnrequest.dto.ReturnResponse;
import com.hida.cohida.returnrequest.service.ReturnService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/customers/me/orders")
@PreAuthorize("hasRole('CUSTOMER')")
public class ReturnController {
    private final ReturnService returns;

    public ReturnController(ReturnService returns) {
        this.returns = returns;
    }

    @GetMapping("/returns")
    @Transactional(readOnly = true)
    public java.util.List<ReturnResponse> all(@AuthenticationPrincipal AuthenticatedCustomer p) {
        return returns.customerReturns(p.customerId()).stream().map(ReturnResponse::from).toList();
    }

    @PostMapping("/{orderId}/returns")
    @Transactional
    public ReturnResponse create(@AuthenticationPrincipal AuthenticatedCustomer p, @PathVariable Long orderId, @RequestBody CreateReturnRequest r) {
        return ReturnResponse.from(returns.request(p.customerId(), orderId, r.orderItemId(), r.reason()));
    }

}

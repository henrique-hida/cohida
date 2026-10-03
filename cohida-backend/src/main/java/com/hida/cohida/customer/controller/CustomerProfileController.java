package com.hida.cohida.customer.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.customer.dto.*;
import com.hida.cohida.customer.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/me")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerProfileController {
    private final CustomerService customerService;

    public CustomerProfileController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public CustomerResponse profile(@AuthenticationPrincipal AuthenticatedCustomer principal) {
        return CustomerResponse.from(customerService.findById(principal.customerId()));
    }

    @PatchMapping
    public CustomerResponse update(@AuthenticationPrincipal AuthenticatedCustomer principal,
                                   @RequestBody CustomerProfileUpdateRequest request) {
        return CustomerResponse.from(customerService.updateProfile(principal.customerId(), request));
    }

    @PatchMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal AuthenticatedCustomer principal,
                               @RequestBody PasswordUpdateRequest request) {
        customerService.changePassword(principal.customerId(), request);
    }

    @PatchMapping("/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@AuthenticationPrincipal AuthenticatedCustomer principal) {
        customerService.deactivate(principal.customerId());
    }

    @GetMapping("/addresses")
    public List<CustomerAddressResponse> addresses(@AuthenticationPrincipal AuthenticatedCustomer principal) {
        return customerService.findAddresses(principal.customerId()).stream().map(CustomerAddressResponse::from).toList();
    }

    @org.springframework.web.bind.annotation.PostMapping("/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerAddressResponse addAddress(@AuthenticationPrincipal AuthenticatedCustomer principal,
                                              @RequestBody CustomerAddressRequest request) {
        return CustomerAddressResponse.from(customerService.addAddress(principal.customerId(), request));
    }

    @PatchMapping("/addresses/{addressId}")
    public CustomerAddressResponse updateAddress(@AuthenticationPrincipal AuthenticatedCustomer principal,
                                                 @PathVariable Long addressId,
                                                 @RequestBody CustomerAddressRequest request) {
        return CustomerAddressResponse.from(customerService.updateAddress(principal.customerId(), addressId, request));
    }

    @DeleteMapping("/addresses/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAddress(@AuthenticationPrincipal AuthenticatedCustomer principal, @PathVariable Long addressId) {
        customerService.removeAddress(principal.customerId(), addressId);
    }
}

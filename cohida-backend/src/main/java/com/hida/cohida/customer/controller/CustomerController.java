package com.hida.cohida.customer.controller;

import com.hida.cohida.auth.dto.RegisterRequest;
import com.hida.cohida.auth.service.AuthService;
import com.hida.cohida.customer.dto.CustomerPageResponse;
import com.hida.cohida.customer.dto.CustomerResponse;
import com.hida.cohida.customer.dto.CustomerUpdateRequest;
import com.hida.cohida.customer.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@PreAuthorize("hasRole('ADMIN')")
public class CustomerController {
    private final CustomerService customerService;
    private final AuthService authService;

    public CustomerController(
            CustomerService customerService,
            AuthService authService
    ) {
        this.customerService = customerService;
        this.authService = authService;
    }

    @GetMapping
    public CustomerPageResponse findAll(@RequestParam(defaultValue = "") String search,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        var customers = customerService.findActivePage(search, page, size);
        List<CustomerResponse> content = customers.stream()
                .map(CustomerResponse::from).toList();
        return new CustomerPageResponse(content, page, size, customers.getTotalElements());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerResponse create(@RequestBody RegisterRequest request) {
        return CustomerResponse.from(authService.createCustomer(request));
    }

    @GetMapping("/{id}")
    public CustomerResponse findById(@PathVariable Long id) {
        return CustomerResponse.from(customerService.findById(id));
    }

    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable Long id, @RequestBody CustomerUpdateRequest request) {
        return CustomerResponse.from(customerService.update(id, request));
    }

    @PatchMapping("/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable Long id) {
        customerService.deactivate(id);
    }
}

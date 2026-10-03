package com.hida.cohida.returnrequest.controller;

import com.hida.cohida.returnrequest.dto.ReturnResponse;
import com.hida.cohida.returnrequest.dto.ReturnStatusRequest;
import com.hida.cohida.returnrequest.service.ReturnService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/returns")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReturnController {
    private final ReturnService returns;

    public AdminReturnController(ReturnService returns) {
        this.returns = returns;
    }

    @GetMapping
    public List<ReturnResponse> all() {
        return returns.all().stream().map(ReturnResponse::from).toList();
    }

    @PatchMapping("/{id}/status")
    public ReturnResponse status(@PathVariable Long id, @RequestBody ReturnStatusRequest r) {
        return ReturnResponse.from(returns.status(id, r.status()));
    }
}

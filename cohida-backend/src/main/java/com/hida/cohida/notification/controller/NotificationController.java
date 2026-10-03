package com.hida.cohida.notification.controller;

import com.hida.cohida.auth.security.AuthenticatedCustomer;
import com.hida.cohida.notification.dto.NotificationResponse;
import com.hida.cohida.notification.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/me/notifications")
@PreAuthorize("hasRole('CUSTOMER')")
public class NotificationController {
    private final NotificationService notifications;

    public NotificationController(NotificationService n) {
        notifications = n;
    }

    @GetMapping
    public List<NotificationResponse> all(@AuthenticationPrincipal AuthenticatedCustomer p) {
        return notifications.all(p.customerId()).stream().map(NotificationResponse::from).toList();
    }

    @PatchMapping("/{id}/read")
    public void read(@AuthenticationPrincipal AuthenticatedCustomer p, @PathVariable Long id) {
        notifications.read(p.customerId(), id);
    }
}

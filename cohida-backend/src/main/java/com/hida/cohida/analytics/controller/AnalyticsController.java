package com.hida.cohida.analytics.controller;

import com.hida.cohida.analytics.dto.AnalyticsOverviewResponse;
import com.hida.cohida.analytics.dto.SalesPointResponse;
import com.hida.cohida.analytics.dto.TopProductResponse;
import com.hida.cohida.analytics.service.AnalyticsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {
    private final AnalyticsService analytics;

    public AnalyticsController(AnalyticsService a) {
        analytics = a;
    }

    @GetMapping("/overview")
    public AnalyticsOverviewResponse overview(@RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        return analytics.overview(from, to);
    }

    @GetMapping("/sales")
    public List<SalesPointResponse> sales(@RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to, @RequestParam(defaultValue = "day") String groupBy) {
        return analytics.sales(from, to, groupBy);
    }

    @GetMapping("/products/top")
    public List<TopProductResponse> top(@RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to) {
        return analytics.top(from, to);
    }
}

package com.hida.cohida.analytics.service;

import com.hida.cohida.analytics.dto.AnalyticsOverviewResponse;
import com.hida.cohida.analytics.dto.SalesPointResponse;
import com.hida.cohida.analytics.dto.TopProductResponse;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.returnrequest.repository.ReturnRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class AnalyticsService {
    private final OrderRepository orders;
    private final ReturnRequestRepository returns;
    private final ProductRepository products;

    public AnalyticsService(OrderRepository o, ReturnRequestRepository r, ProductRepository p) {
        orders = o;
        returns = r;
        products = p;
    }

    private List<SaleOrder> filtered(LocalDate from, LocalDate to, String category) {
        boolean hasCategoryFilter = category != null && !category.isBlank();
        Set<String> categorySkus = !hasCategoryFilter ? Set.of() : products.findByActiveTrueOrderByNameAsc().stream()
                .filter(product -> product.getCategories().contains(category))
                .flatMap(product -> product.getVariants().stream()).map(variant -> variant.getSku()).collect(java.util.stream.Collectors.toSet());
        return orders.findAllByOrderByCreatedAtDesc().stream().filter(o -> !o.getStatus().equals(OrderStatus.CANCELADO)).filter(o -> from == null || !o.getCreatedAt().toLocalDate().isBefore(from)).filter(o -> to == null || !o.getCreatedAt().toLocalDate().isAfter(to)).filter(o -> !hasCategoryFilter || o.getItems().stream().anyMatch(item -> categorySkus.contains(item.getSku()))).toList();
    }

    @Transactional(readOnly = true)
    public AnalyticsOverviewResponse overview(LocalDate f, LocalDate t, String category) {
        var list = filtered(f, t, category);
        long revenue = list.stream().mapToLong(SaleOrder::getTotalCents).sum();
        return new AnalyticsOverviewResponse(revenue, list.size(), list.isEmpty() ? 0 : revenue / list.size(), list.stream().mapToLong(SaleOrder::getDiscountCents).sum(), returns.count());
    }

    @Transactional(readOnly = true)
    public List<SalesPointResponse> sales(LocalDate f, LocalDate t, String groupBy, String category) {
        Map<String, List<SaleOrder>> g = new TreeMap<>();
        for (var o : filtered(f, t, category)) {
            String k = "month".equalsIgnoreCase(groupBy) ? o.getCreatedAt().toLocalDate().withDayOfMonth(1).toString() : o.getCreatedAt().toLocalDate().toString();
            g.computeIfAbsent(k, x -> new ArrayList<>()).add(o);
        }
        return g.entrySet().stream().map(e -> new SalesPointResponse(e.getKey(), e.getValue().stream().mapToLong(SaleOrder::getTotalCents).sum(), e.getValue().size())).toList();
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> top(LocalDate f, LocalDate t, String category) {
        Map<String, long[]> m = new HashMap<>();
        for (var o : filtered(f, t, category))
            for (var i : o.getItems()) {
                long[] x = m.computeIfAbsent(i.getSku(), k -> new long[]{0, 0});
                x[0] += i.getQuantity();
                x[1] += i.getUnitPriceCents() * i.getQuantity();
            }
        return m.entrySet().stream().map(e -> new TopProductResponse(e.getKey(), e.getKey(), e.getValue()[0], e.getValue()[1])).sorted(Comparator.comparingLong(TopProductResponse::revenueCents).reversed()).limit(10).toList();
    }
}

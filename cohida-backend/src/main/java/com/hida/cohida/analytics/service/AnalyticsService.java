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

    private List<SaleOrder> filtered(LocalDate from, LocalDate to, List<String> categories) {
        List<String> selectedCategories = categories == null
                ? List.of()
                : categories.stream().filter(category -> category != null && !category.isBlank()).distinct().toList();
        boolean hasCategoryFilter = !selectedCategories.isEmpty();
        Set<String> categorySkus = !hasCategoryFilter
                ? Set.of()
                : products.findByActiveTrueOrderByNameAsc().stream()
                        .filter(product -> selectedCategories.stream()
                                .anyMatch(product.getCategories()::contains))
                        .flatMap(product -> product.getVariants().stream())
                        .map(variant -> variant.getSku())
                        .collect(java.util.stream.Collectors.toSet());
        return orders.findAllByOrderByCreatedAtDesc().stream()
                .filter(order -> !order.getStatus().equals(OrderStatus.CANCELADO))
                .filter(order -> from == null || !order.getCreatedAt().toLocalDate().isBefore(from))
                .filter(order -> to == null || !order.getCreatedAt().toLocalDate().isAfter(to))
                .filter(order -> !hasCategoryFilter || order.getItems().stream()
                        .anyMatch(item -> categorySkus.contains(item.getSku())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AnalyticsOverviewResponse overview(LocalDate f, LocalDate t, List<String> categories) {
        var list = filtered(f, t, categories);
        long revenue = list.stream().mapToLong(SaleOrder::getTotalCents).sum();
        return new AnalyticsOverviewResponse(revenue, list.size(), list.isEmpty() ? 0 : revenue / list.size(), list.stream().mapToLong(SaleOrder::getDiscountCents).sum(), returns.count());
    }

    @Transactional(readOnly = true)
    public List<SalesPointResponse> sales(LocalDate f, LocalDate t, String groupBy, List<String> categories) {
        List<String> selectedCategories = categories == null
                ? List.of()
                : categories.stream().filter(category -> category != null && !category.isBlank()).distinct().toList();

        if (selectedCategories.isEmpty()) {
            Map<String, List<SaleOrder>> totals = new TreeMap<>();
            for (var order : filtered(f, t, List.of())) {
                String period = period(order, groupBy);
                totals.computeIfAbsent(period, ignored -> new ArrayList<>()).add(order);
            }
            return totals.entrySet().stream()
                    .map(entry -> new SalesPointResponse(
                            entry.getKey(),
                            null,
                            entry.getValue().stream().mapToLong(SaleOrder::getTotalCents).sum(),
                            entry.getValue().size()))
                    .toList();
        }

        Map<String, Set<String>> categorySkus = new LinkedHashMap<>();
        selectedCategories.forEach(category -> categorySkus.put(category, new HashSet<>()));
        products.findByActiveTrueOrderByNameAsc().forEach(product -> {
            product.getCategories().stream()
                    .filter(categorySkus::containsKey)
                    .forEach(category -> product.getVariants().stream()
                            .map(variant -> variant.getSku())
                            .forEach(categorySkus.get(category)::add));
        });

        Map<String, Map<String, long[]>> totals = new TreeMap<>();
        for (var order : filtered(f, t, selectedCategories)) {
            String period = period(order, groupBy);
            Map<String, long[]> periodTotals = totals.computeIfAbsent(period, ignored -> new LinkedHashMap<>());
            for (String category : selectedCategories) {
                Set<String> skus = categorySkus.get(category);
                long categoryRevenue = order.getItems().stream()
                        .filter(item -> skus.contains(item.getSku()))
                        .mapToLong(item -> item.getUnitPriceCents() * item.getQuantity())
                        .sum();
                if (categoryRevenue == 0) continue;
                long[] values = periodTotals.computeIfAbsent(category, ignored -> new long[2]);
                values[0] += categoryRevenue;
                values[1]++;
            }
        }
        return totals.entrySet().stream()
                .flatMap(period -> period.getValue().entrySet().stream()
                        .map(category -> new SalesPointResponse(
                                period.getKey(), category.getKey(), category.getValue()[0], category.getValue()[1])))
                .toList();
    }

    private static String period(SaleOrder order, String groupBy) {
        var date = order.getCreatedAt().toLocalDate();
        return "month".equalsIgnoreCase(groupBy) ? date.withDayOfMonth(1).toString() : date.toString();
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> top(LocalDate f, LocalDate t, List<String> categories) {
        Map<String, long[]> m = new HashMap<>();
        for (var o : filtered(f, t, categories))
            for (var i : o.getItems()) {
                long[] x = m.computeIfAbsent(i.getSku(), k -> new long[]{0, 0});
                x[0] += i.getQuantity();
                x[1] += i.getUnitPriceCents() * i.getQuantity();
            }
        return m.entrySet().stream().map(e -> new TopProductResponse(e.getKey(), e.getKey(), e.getValue()[0], e.getValue()[1])).sorted(Comparator.comparingLong(TopProductResponse::revenueCents).reversed()).limit(10).toList();
    }
}

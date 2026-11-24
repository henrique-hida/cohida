package com.hida.cohida.analytics.service;

import com.hida.cohida.analytics.dto.AnalyticsOverviewResponse;
import com.hida.cohida.analytics.dto.SalesPointResponse;
import com.hida.cohida.analytics.dto.TopProductResponse;
import com.hida.cohida.analytics.repository.AnalyticsQueries;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.returnrequest.repository.ReturnRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class AnalyticsService {
  private final OrderRepository orders;
  private final ReturnRequestRepository returns;
  private final AnalyticsQueries queries;

  public AnalyticsService(
      OrderRepository orders, ReturnRequestRepository returns,
      AnalyticsQueries queries) {
    this.orders = orders;
    this.returns = returns;
    this.queries = queries;
  }

  private List<Long> categories(List<Long> categoryIds) {
    return categoryIds == null
        ? List.of()
        : categoryIds.stream().filter(Objects::nonNull).distinct().toList();
  }

  @Transactional(readOnly = true)
  public AnalyticsOverviewResponse overview(
      LocalDate from, LocalDate to, List<Long> categoryIds) {
    long[] totals = queries.overview(from, to, categories(categoryIds));
    return new AnalyticsOverviewResponse(
        totals[0], totals[1], totals[1] == 0 ? 0 : totals[0] / totals[1],
        totals[2], returns.count());
  }

  @Transactional(readOnly = true)
  public List<SalesPointResponse> sales(
      LocalDate f, LocalDate t, List<Long> categoryIds) {
    if (f == null
        || t == null
        || t.isBefore(f)
        || t.isBefore(f.plusMonths(1))
        || t.isAfter(f.plusMonths(24))) {
      throw new IllegalArgumentException(
          "Informe um período entre 1 e 24 meses.");
    }
    List<Long> selectedCategories = categories(categoryIds);
    if (selectedCategories.isEmpty()) return List.of();

    Map<String, SalesPointResponse> results = new HashMap<>();
    for (Object[] row :
        orders.aggregateSalesByCategory(
            f.atStartOfDay(),
            t.plusDays(1).atStartOfDay(),
            selectedCategories)) {
      var month =
          java.time.YearMonth.of(
              ((Number) row[0]).intValue(), ((Number) row[1]).intValue());
      Long categoryId = ((Number) row[2]).longValue();
      results.put(
          month + ":" + categoryId,
          new SalesPointResponse(
              month.atDay(1).toString(),
              categoryId,
              ((Number) row[3]).longValue(),
              ((Number) row[4]).longValue()));
    }
    List<SalesPointResponse> points = new ArrayList<>();
    for (var month = java.time.YearMonth.from(f);
        !month.isAfter(java.time.YearMonth.from(t));
        month = month.plusMonths(1)) {
      for (Long categoryId : selectedCategories) {
        points.add(
            results.getOrDefault(
                month + ":" + categoryId,
                new SalesPointResponse(
                    month.atDay(1).toString(), categoryId, 0, 0)));
      }
    }
    return points;
  }

  @Transactional(readOnly = true)
  public List<TopProductResponse> top(
      LocalDate f, LocalDate t, List<Long> categoryIds) {
    return queries.top(f, t, categories(categoryIds));
  }
}

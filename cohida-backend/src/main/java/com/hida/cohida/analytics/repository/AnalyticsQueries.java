package com.hida.cohida.analytics.repository;

import com.hida.cohida.analytics.dto.TopProductResponse;
import com.hida.cohida.order.domain.OrderStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Repository;

/** Aggregates matching orders without loading their entities. */
@Repository
public class AnalyticsQueries {
  private final EntityManager entityManager;

  public AnalyticsQueries(EntityManager entityManager) {
    this.entityManager = entityManager;
  }

  private String filter(LocalDate from, LocalDate to, List<Long> categories) {
    StringBuilder where = new StringBuilder(" where o.status <> :cancelled");
    if (from != null) where.append(" and o.createdAt >= :from");
    if (to != null) where.append(" and o.createdAt < :until");
    if (!categories.isEmpty()) {
      where.append("""
           and exists (select matched.id from OrderItem matched,
             ProductVariant variant join variant.product product
             join product.categories category
             where matched.order = o and variant.sku = matched.sku
             and product.active = true and category.id in :categories)
          """);
    }
    return where.toString();
  }

  private void parameters(TypedQuery<?> query, LocalDate from, LocalDate to,
      List<Long> categories) {
    query.setParameter("cancelled", OrderStatus.CANCELADO);
    if (from != null) query.setParameter("from", from.atStartOfDay());
    if (to != null) query.setParameter("until", to.plusDays(1).atStartOfDay());
    if (!categories.isEmpty()) query.setParameter("categories", categories);
  }

  public long[] overview(LocalDate from, LocalDate to, List<Long> categories) {
    String jpql = "select coalesce(sum(o.totalCents), 0), count(o), "
        + "coalesce(sum(o.discountCents), 0) from SaleOrder o"
        + filter(from, to, categories);
    var query = entityManager.createQuery(jpql, Object[].class);
    parameters(query, from, to, categories);
    Object[] row = query.getSingleResult();
    return new long[] {((Number) row[0]).longValue(),
        ((Number) row[1]).longValue(), ((Number) row[2]).longValue()};
  }

  public List<TopProductResponse> top(
      LocalDate from, LocalDate to, List<Long> categories) {
    String jpql = "select i.sku, sum(i.quantity), "
        + "sum(i.unitPriceCents * i.quantity) "
        + "from SaleOrder o join o.items i" + filter(from, to, categories)
        + " group by i.sku order by sum(i.unitPriceCents * i.quantity) desc, "
        + "i.sku asc";
    var query = entityManager.createQuery(jpql, Object[].class)
        .setMaxResults(10);
    parameters(query, from, to, categories);
    return query.getResultList().stream().map(row -> new TopProductResponse(
        (String) row[0], (String) row[0], ((Number) row[1]).longValue(),
        ((Number) row[2]).longValue())).toList();
  }
}

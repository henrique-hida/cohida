package com.hida.cohida.analytics.service;

import com.hida.cohida.analytics.dto.TopProductResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/** Aggregates matching orders in the database. */
@Repository
class AnalyticsQueries {
  private final NamedParameterJdbcTemplate jdbc;

  AnalyticsQueries(NamedParameterJdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  private MapSqlParameterSource parameters(
      LocalDate from, LocalDate to, List<Long> categories) {
    var parameters = new MapSqlParameterSource();
    if (from != null) parameters.addValue("from", from.atStartOfDay());
    if (to != null) parameters.addValue("until", to.plusDays(1).atStartOfDay());
    if (!categories.isEmpty()) parameters.addValue("categories", categories);
    return parameters;
  }

  private String filter(LocalDate from, LocalDate to, List<Long> categories) {
    StringBuilder where = new StringBuilder(" where o.status <> 'CANCELADO'");
    if (from != null) where.append(" and o.created_at >= :from");
    if (to != null) where.append(" and o.created_at < :until");
    if (!categories.isEmpty()) {
      where.append("""
           and exists (select 1 from order_items matched
             join product_variants v on v.sku = matched.sku
             join products p on p.id = v.product_id and p.active = true
             join product_categories pc on pc.product_id = p.id
             where matched.order_id = o.id and pc.category_id in (:categories))
          """);
    }
    return where.toString();
  }

  long[] overview(LocalDate from, LocalDate to, List<Long> categories) {
    String sql = "select coalesce(sum(o.total_cents), 0), count(*), "
        + "coalesce(sum(o.discount_cents), 0) from orders o"
        + filter(from, to, categories);
    return jdbc.queryForObject(sql, parameters(from, to, categories),
        (row, index) -> new long[] {
            row.getLong(1), row.getLong(2), row.getLong(3)});
  }

  List<TopProductResponse> top(
      LocalDate from, LocalDate to, List<Long> categories) {
    String sql = "select i.sku, sum(i.quantity), "
        + "sum(i.unit_price_cents * i.quantity) as revenue "
        + "from orders o join order_items i on i.order_id = o.id"
        + filter(from, to, categories)
        + " group by i.sku order by revenue desc, i.sku asc limit 10";
    return jdbc.query(sql, parameters(from, to, categories),
        (row, index) -> new TopProductResponse(
            row.getString(1), row.getString(1),
            row.getLong(2), row.getLong(3)));
  }
}

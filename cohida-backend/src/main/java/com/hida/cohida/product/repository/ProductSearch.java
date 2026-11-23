package com.hida.cohida.product.repository;

import java.util.List;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProductSearch {
  private final NamedParameterJdbcTemplate jdbc;

  public ProductSearch(NamedParameterJdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public Result find(String search, Long categoryId, int page, int size) {
    var params = new MapSqlParameterSource();
    var where = new StringBuilder(" where p.active = true");
    if (!search.isEmpty()) {
      // Both sides are normalized in the database to preserve accent folding.
      String normalized = "lower(regexp_replace(normalize(%s, NFD), "
          + "U&'[\\0300-\\036f]', '', 'g'))";
      String match = " like :search escape '!'";
      where.append(" and (")
          .append(normalized.formatted("p.name")).append(match)
          .append(" or ").append(normalized.formatted("p.brand")).append(match)
          .append(" or ").append(normalized.formatted("p.description"))
          .append(match).append(")");
      params.addValue("search", "%" + search.replace("!", "!!")
          .replace("%", "!%").replace("_", "!_") + "%");
    }
    if (categoryId != null) {
      where.append(" and exists (select 1 from product_categories pc "
          + "where pc.product_id = p.id and pc.category_id = :categoryId)");
      params.addValue("categoryId", categoryId);
    }
    long total = jdbc.queryForObject("select count(*) from products p" + where,
        params, Long.class);
    params.addValue("limit", size).addValue("offset", (long) page * size);
    List<Long> ids = jdbc.queryForList("select p.id from products p" + where
        + " order by p.name asc, p.id asc limit :limit offset :offset",
        params, Long.class);
    return new Result(ids, total);
  }

  public record Result(List<Long> ids, long total) {}
}

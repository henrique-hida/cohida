package com.hida.cohida.chat;

import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.repository.ProductRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;

/** Ranks the current catalog from explicit interests and historical signals. */
final class ChatRecommendations {
  private final JdbcTemplate jdbc;
  private final OrderRepository orders;
  private final ProductRepository products;

  ChatRecommendations(JdbcTemplate jdbc, OrderRepository orders,
      ProductRepository products) {
    this.jdbc = jdbc;
    this.orders = orders;
    this.products = products;
  }

  List<String> rank(long customerId, List<ChatController.Interest> interests) {
    var all = products.findByActiveTrueOrderByNameAsc();
    var boughtVariants = orders.findByCustomerIdOrderByCreatedAtDesc(customerId)
        .stream()
        .filter(order -> List.of(OrderStatus.APROVADA, OrderStatus.EM_TRANSITO,
            OrderStatus.ENTREGUE).contains(order.getStatus()))
        .limit(30).flatMap(order -> order.getItems().stream())
        .map(item -> item.getVariantId()).collect(Collectors.toSet());
    var boughtCategories = all.stream()
        .filter(product -> product.getVariants().stream()
            .anyMatch(variant -> boughtVariants.contains(variant.getId())))
        .flatMap(product -> product.getCategories().stream())
        .map(category -> category.getSlug()).collect(Collectors.toSet());
    var feedback = jdbc.query(
        "select p.product_slug, r.useful from chat_response_products p "
            + "join chat_responses r on r.id = p.response_id "
            + "where r.customer_id = ? and r.useful is not null "
            + "order by r.id desc limit 100",
        (rs, row) -> Map.entry(rs.getString(1), rs.getBoolean(2)), customerId);
    return all.stream()
        .filter(product -> product.getVariants().stream()
            .anyMatch(variant -> variant.getStockQuantity() > 0))
        .sorted(java.util.Comparator.comparingInt((Product product) -> {
          String text = ChatService.normalize(product.getName() + " "
              + product.getCategories().stream()
                  .map(category -> category.getName())
                  .collect(Collectors.joining(" ")));
          int score = interests.stream().anyMatch(item ->
              matchesInterest(text, item.sport())) ? 10 : 0;
          if (interests.stream().anyMatch(item -> item.focus() != null
              && !item.focus().equals("Pular")
              && text.contains(ChatService.normalize(item.focus()))))
            score += 2;
          if (product.getCategories().stream().anyMatch(category ->
              boughtCategories.contains(category.getSlug()))) score += 4;
          var rating = feedback.stream()
              .filter(item -> item.getKey().equals(product.getSlug()))
              .findFirst();
          if (rating.isPresent()) score += rating.get().getValue() ? 1 : -1;
          return score;
        }).reversed())
        .limit(10).map(Product::getSlug).toList();
  }

  private static boolean matchesInterest(String text, String sport) {
    if (text.contains(ChatService.normalize(sport))) return true;
    return switch (sport) {
      case "Judô" -> text.contains("artes marciais") || text.contains("judogi");
      case "Trilha" -> text.contains("outdoor");
      default -> false;
    };
  }
}

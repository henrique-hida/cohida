package com.hida.cohida.chat.service;

import com.hida.cohida.chat.dto.ChatDtos;
import com.hida.cohida.chat.repository.ChatResponseProductRepository;


import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.repository.ProductRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;

/** Ranks the current catalog from explicit interests and historical signals. */
final class ChatRecommendations {
  private final ChatResponseProductRepository responseProducts;
  private final OrderRepository orders;
  private final ProductRepository products;

  ChatRecommendations(ChatResponseProductRepository responseProducts,
      OrderRepository orders,
      ProductRepository products) {
    this.responseProducts = responseProducts;
    this.orders = orders;
    this.products = products;
  }

  List<String> rank(long customerId,
      List<ChatDtos.CategoryInterest> interests) {
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
    var feedback = responseProducts.findFeedback(customerId,
        PageRequest.of(0, 100)).stream().map(row ->
            Map.entry((String) row[0], (Boolean) row[1])).toList();
    return all.stream()
        .filter(product -> product.getVariants().stream()
            .anyMatch(variant -> variant.getStockQuantity() > 0))
        .sorted(java.util.Comparator.comparingInt((Product product) -> {
          int score = product.getCategories().stream().anyMatch(category ->
              interests.stream().anyMatch(interest ->
                  category.getId().equals(interest.categoryId()))) ? 10 : 0;
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

}

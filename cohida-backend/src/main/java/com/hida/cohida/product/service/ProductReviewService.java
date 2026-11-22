package com.hida.cohida.product.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.product.domain.Product;
import com.hida.cohida.product.domain.ProductReview;
import com.hida.cohida.product.dto.ProductReviewRequest;
import com.hida.cohida.product.dto.ReviewEligibilityResponse;
import com.hida.cohida.product.exception.ProductNotFoundException;
import com.hida.cohida.product.repository.ProductRepository;
import com.hida.cohida.product.repository.ProductReviewRepository;
import com.hida.cohida.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ProductReviewService {
  private final ProductReviewRepository reviews;
  private final ProductRepository products;
  private final ProductVariantRepository variants;
  private final CustomerRepository customers;
  private final OrderRepository orders;

  public ProductReviewService(
      ProductReviewRepository reviews,
      ProductRepository products,
      ProductVariantRepository variants,
      CustomerRepository customers,
      OrderRepository orders) {
    this.reviews = reviews;
    this.products = products;
    this.variants = variants;
    this.customers = customers;
    this.orders = orders;
  }

  @Transactional(readOnly = true)
  public List<ProductReview> publicReviews(String slug) {
    Product product =
        products
            .findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> new ProductNotFoundException(slug));
    return reviews.findByProductIdOrderByCreatedAtDesc(product.getId());
  }

  @Transactional(readOnly = true)
  public ReviewEligibilityResponse eligibility(
      Long customerId, Long productId, Long requestedOrderId) {
    Product product =
        products
            .findById(productId)
            .orElseThrow(
                () -> new ProductNotFoundException(productId.toString()));
    if (reviews.existsByCustomerIdAndProductId(customerId, productId))
      return new ReviewEligibilityResponse(false, true, null);
    Long orderId =
        eligibleOrders(customerId, product, requestedOrderId).stream()
            .map(SaleOrder::getId)
            .findFirst()
            .orElse(null);
    return new ReviewEligibilityResponse(orderId != null, false, orderId);
  }

  @Transactional
  public ProductReview create(
      Long customerId, Long productId, ProductReviewRequest request) {
    if (request == null
        || request.orderId() == null
        || request.rating() == null
        || request.description() == null
        || request.description().isBlank())
      throw new InvalidRequestException(
          "Informe a nota, a descrição e o pedido da avaliação.");
    BigDecimal rating = request.rating().stripTrailingZeros();
    if (rating.compareTo(BigDecimal.ZERO) < 0
        || rating.compareTo(BigDecimal.valueOf(5)) > 0
        || rating.multiply(BigDecimal.valueOf(2)).stripTrailingZeros().scale()
            > 0)
      throw new InvalidRequestException(
          "A nota deve ser de 0 a 5, em intervalos de 0,5.");
    String description = request.description().trim();
    if (description.length() > 1000)
      throw new InvalidRequestException(
          "A descrição deve ter no máximo 1000 caracteres.");
    Product product =
        products
            .findById(productId)
            .orElseThrow(
                () -> new ProductNotFoundException(productId.toString()));
    if (reviews.existsByCustomerIdAndProductId(customerId, productId))
      throw new InvalidRequestException("Você já avaliou este produto.");
    SaleOrder order =
        eligibleOrders(customerId, product, request.orderId()).stream()
            .findFirst()
            .orElseThrow(
                () ->
                    new InvalidRequestException(
                        "A avaliação fica disponível após a "
                            + "aprovação de um pedido que contenha"
                            + " este produto."));
    var customer =
        customers
            .findById(customerId)
            .orElseThrow(
                () -> new InvalidRequestException("Cliente não encontrado."));
    product.registerReview(rating);
    return reviews.save(
        new ProductReview(product, customer, order, rating, description));
  }

  private List<SaleOrder> eligibleOrders(
      Long customerId, Product product, Long requestedOrderId) {
    return orders.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
        .filter(
            order ->
                order.getStatus() == OrderStatus.APROVADA
                    || order.getStatus() == OrderStatus.EM_TRANSITO
                    || order.getStatus() == OrderStatus.ENTREGUE)
        .filter(
            order ->
                requestedOrderId == null
                    || order.getId().equals(requestedOrderId))
        .filter(
            order ->
                order.getItems().stream()
                    .anyMatch(
                        item ->
                            variants
                                .findById(item.getVariantId())
                                .map(
                                    variant ->
                                        variant
                                            .getProduct()
                                            .getId()
                                            .equals(product.getId()))
                                .orElse(false)))
        .toList();
  }
}

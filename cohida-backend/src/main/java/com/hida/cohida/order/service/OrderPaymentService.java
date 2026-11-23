package com.hida.cohida.order.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.notification.service.NotificationService;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.exception.OrderNotFoundException;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.payment.PaymentOutboxEvent;
import com.hida.cohida.payment.PaymentOutboxRepository;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.repository.ProductVariantRepository;
import com.hida.cohida.product.repository.ProductReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderPaymentService {
  private final OrderRepository orders;
  private final ProductVariantRepository variants;
  private final CouponRepository coupons;
  private final NotificationService notifications;
  private final ProductReviewRepository productReviews;
  private final PaymentOutboxRepository paymentOutbox;

  public OrderPaymentService(
      OrderRepository orders,
      ProductVariantRepository variants,
      CouponRepository coupons,
      NotificationService notifications,
      ProductReviewRepository productReviews,
      PaymentOutboxRepository paymentOutbox) {
    this.orders = orders;
    this.variants = variants;
    this.coupons = coupons;
    this.notifications = notifications;
    this.productReviews = productReviews;
    this.paymentOutbox = paymentOutbox;
  }

  @Transactional
  public SaleOrder processPayment(Long id, boolean approved) {
    return processPayment(id, approved, null);
  }

  @Transactional
  public SaleOrder processPayment(Long id, boolean approved, String reason) {
    SaleOrder order = orders.findForPaymentUpdate(id)
        .orElseThrow(() -> new OrderNotFoundException(id));
    if (order.getStatus() != OrderStatus.EM_PROCESSAMENTO)
      throw new InvalidRequestException(
          "Somente pedidos em processamento podem ser processados.");
    order.recordPaymentAuthorization(reason);
    if (approved) {
      var items = new java.util.ArrayList<>(order.getItems());
      items.sort(java.util.Comparator.comparing(OrderItem::getVariantId));
      for (OrderItem item : items) {
        ProductVariant variant =
            variants.findWithLockById(item.getVariantId()).orElseThrow();
        if (item.getQuantity() > variant.getStockQuantity())
          throw new InvalidRequestException(
              "Estoque insuficiente para aprovar o pedido.");
        variant.updateStock(variant.getStockQuantity() - item.getQuantity());
      }
      consumeAppliedCoupons(order);
      order.approve();
    } else {
      order.reject();
    }
    SaleOrder saved = orders.save(order);
    paymentOutbox.save(new PaymentOutboxEvent(saved.getId(), approved));
    if (approved) notifyProductReviews(saved);
    return saved;
  }

  /**
   * Settles coupons only after the payment processor authorizes the order.
   * A return-credit coupon is consumed in full and any amount not needed
   * after promotional discounts is reissued as a new
   * return-credit coupon, preserving the DRS credit trail.
   */
  private void consumeAppliedCoupons(SaleOrder order) {
    if (order.getCouponCode() == null || order.getCouponCode().isBlank())
      return;
    List<Coupon> applied =
        java.util.Arrays.stream(order.getCouponCode().split(","))
            .map(String::trim)
            .filter(code -> !code.isEmpty())
            .map(
                code ->
                    coupons
                        .findByCode(code)
                        .orElseThrow(
                            () ->
                                new InvalidRequestException("Cupom inválido.")))
            .sorted(java.util.Comparator.comparing(Coupon::getId))
            .map(
                coupon ->
                    coupons.findWithLockById(coupon.getId())
                        .orElseThrow(
                            () ->
                                new InvalidRequestException("Cupom inválido.")))
            .toList();
    for (Coupon coupon : applied) {
      if (coupon.isReturnCredit())
        coupon.consumeCredit(coupon.getRemainingCreditCents());
      else coupon.registerRedemption();
    }
    // The DRS requires the unused value of all applied coupons to become
    // a return-credit coupon; promotional coupons therefore also take part
    // in this calculation when their combined value exceeds the items.
    long surplusCredit =
        Math.max(
            0,
            order.getCouponValueCents()
                - order.getSubtotalCents()
                - order.getShippingCents());
    if (surplusCredit > 0) {
      Coupon issued =
          coupons.save(
              Coupon.returnCredit(
                  "TROCA-"
                      + UUID.randomUUID()
                          .toString()
                          .substring(0, 8)
                          .toUpperCase(),
                  order.getCustomer(),
                  surplusCredit));
      order.issueCoupon(issued);
    }
  }

  private void notifyProductReviews(SaleOrder order) {
    Set<Long> notifiedProducts = new HashSet<>();
    for (OrderItem item : order.getItems()) {
      variants
          .findById(item.getVariantId())
          .ifPresent(
              variant -> {
                var product = variant.getProduct();
                if (notifiedProducts.add(product.getId())
                    && !productReviews.existsByCustomerIdAndProductId(
                        order.getCustomer().getId(), product.getId())) {
                  notifications.notify(
                      order.getCustomer(),
                      "PRODUCT_REVIEW_REQUEST",
                      "Avalie "
                          + product.getName()
                          + " quando receber seu pedido.",
                      "/produtos/"
                          + product.getSlug()
                          + "?avaliar="
                          + order.getId());
                }
              });
    }
  }
}

package com.hida.cohida.order.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.notification.service.NotificationService;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.exception.OrderNotFoundException;
import com.hida.cohida.order.dto.PaymentAllocationRequest;
import com.hida.cohida.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {
  private final OrderRepository orders;
  private final NotificationService notifications;
  private final OrderPaymentService payments;
  private final CheckoutService checkout;

  public OrderService(
      OrderRepository orders,
      NotificationService notifications,
      OrderPaymentService payments,
      CheckoutService checkout) {
    this.orders = orders;
    this.notifications = notifications;
    this.payments = payments;
    this.checkout = checkout;
  }

  public SaleOrder checkout(Long customerId, Long addressId, Long cardId) {
    return checkout.checkout(customerId, addressId, cardId);
  }

  public SaleOrder checkout(
      Long customerId,
      Long addressId,
      List<PaymentAllocationRequest> requestedPayments) {
    return checkout.checkout(customerId, addressId, requestedPayments);
  }

  @Transactional(readOnly = true)
  public List<SaleOrder> customerOrders(Long customerId) {
    return orders.findByCustomerIdOrderByCreatedAtDesc(customerId);
  }

  @Transactional(readOnly = true)
  public SaleOrder customerOrder(Long customerId, Long id) {
    return orders
        .findByIdAndCustomerId(id, customerId)
        .orElseThrow(() -> new OrderNotFoundException(id));
  }

  @Transactional(readOnly = true)
  public List<SaleOrder> adminOrders() {
    return orders.findAllByOrderByCreatedAtDesc();
  }

  @Transactional(readOnly = true)
  public SaleOrder adminOrder(Long id) {
    return orders
        .findById(id)
        .orElseThrow(() -> new OrderNotFoundException(id));
  }

  @Transactional
  public SaleOrder changeStatus(Long id, OrderStatus status) {
    if (status == null)
      throw new InvalidRequestException("Informe o próximo status do pedido.");
    SaleOrder order = adminOrder(id);
    if (status != OrderStatus.ENTREGUE)
      throw new InvalidRequestException(
          "O administrador só pode confirmar "
              + "pedidos em transporte como entregues.");
    order.confirmDelivery();
    return orders.save(order);
  }

  public SaleOrder processPayment(Long id, boolean approved) {
    return payments.processPayment(id, approved);
  }

  public SaleOrder processPayment(Long id, boolean approved, String reason) {
    return payments.processPayment(id, approved, reason);
  }

  @Transactional
  public SaleOrder dispatch(Long id, String trackingCode) {
    if (trackingCode == null || trackingCode.isBlank())
      throw new InvalidRequestException("Informe o código de rastreio.");
    SaleOrder order = adminOrder(id);
    order.dispatch(trackingCode.trim());
    SaleOrder saved = orders.save(order);
    notifications.notify(
        order.getCustomer(),
        "ORDER_DISPATCHED",
        "Seu pedido foi despachado.",
        "/pedidos/" + id);
    return saved;
  }

  @Transactional
  public SaleOrder cancel(Long customerId, Long orderId, String reason) {
    SaleOrder order = orders.findForCancellation(orderId, customerId)
        .orElseThrow(() -> new OrderNotFoundException(orderId));
    order.cancel(reason == null ? null : reason.trim());
    SaleOrder saved = orders.save(order);
    notifications.notify(
        order.getCustomer(),
        "ORDER_CANCELLED",
        "Seu pedido foi cancelado.",
        "/pedidos/" + orderId);
    return saved;
  }

  @Transactional
  public SaleOrder confirmReceipt(Long customerId, Long orderId) {
    SaleOrder order = customerOrder(customerId, orderId);
    if (order.getStatus() != OrderStatus.EM_TRANSITO)
      throw new InvalidRequestException(
          "A confirmação está disponível somente para pedidos em trânsito.");
    order.confirmDelivery();
    return orders.save(order);
  }

}

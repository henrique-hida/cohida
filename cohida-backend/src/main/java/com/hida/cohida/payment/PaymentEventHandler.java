package com.hida.cohida.payment;

import com.hida.cohida.notification.service.NotificationService;
import com.hida.cohida.order.repository.OrderRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Applies the event and its deduplication marker in one DB transaction. */
@Service
public class PaymentEventHandler {
  private final PaymentOutboxRepository events;
  private final OrderRepository orders;
  private final NotificationService notifications;

  public PaymentEventHandler(
      PaymentOutboxRepository events, OrderRepository orders,
      NotificationService notifications) {
    this.events = events;
    this.orders = orders;
    this.notifications = notifications;
  }

  @Transactional
  public boolean process(String id) {
    var event = events.findForUpdate(id).orElse(null);
    if (event == null || event.isComplete()) return true;
    LocalDateTime now = LocalDateTime.now();
    if (!event.isReady(now)) return false;
    var order = orders.findById(event.getOrderId()).orElseThrow();
    String message = switch (event.getEventType()) {
      case "PAYMENT_APPROVED" -> "O pagamento do seu pedido foi aprovado.";
      case "PAYMENT_DECLINED" -> "O pagamento do seu pedido foi recusado.";
      default -> throw new IllegalArgumentException("Tipo de evento inválido");
    };
    notifications.notify(order.getCustomer(), event.getEventType(), message,
        "/pedidos/" + order.getId());
    event.processed(now);
    return true;
  }

  @Transactional
  public boolean recordFailure(String id, String error) {
    var event = events.findForUpdate(id).orElse(null);
    if (event == null || event.isComplete()) return false;
    event.failed(LocalDateTime.now(), error);
    return event.isComplete();
  }
}

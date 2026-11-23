package com.hida.cohida.returnrequest.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.order.exception.OrderNotFoundException;
import com.hida.cohida.notification.service.NotificationService;
import com.hida.cohida.product.repository.ProductVariantRepository;
import com.hida.cohida.returnrequest.domain.ReturnRequest;
import com.hida.cohida.returnrequest.domain.ReturnStatus;
import com.hida.cohida.returnrequest.repository.ReturnRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ReturnService {
  private final ReturnRequestRepository returns;
  private final OrderRepository orders;
  private final CouponRepository coupons;
  private final ProductVariantRepository variants;
  private final NotificationService notifications;

  public ReturnService(
      ReturnRequestRepository returns,
      OrderRepository orders,
      CouponRepository coupons,
      ProductVariantRepository variants,
      NotificationService notifications) {
    this.returns = returns;
    this.orders = orders;
    this.coupons = coupons;
    this.variants = variants;
    this.notifications = notifications;
  }

  @Transactional
  public ReturnRequest request(
      Long customerId, Long orderId, Long itemId, String reason) {
    if (reason == null || reason.isBlank())
      throw new InvalidRequestException("Informe o motivo da devolução.");
    SaleOrder order = orders.findForReturnRequest(orderId, customerId)
        .orElseThrow(() -> new OrderNotFoundException(orderId));
    if (order.getStatus() != OrderStatus.ENTREGUE)
      throw new InvalidRequestException(
          "A devolução só pode ser solicitada após a entrega.");
    if (itemId == null) {
      if (returns.existsByOrderId(orderId))
        throw new InvalidRequestException(
            "Já existe uma troca para este pedido.");
      order.beginWholeExchange();
      return returns.save(new ReturnRequest(order, reason.trim()));
    }
    OrderItem item =
        order.getItems().stream()
            .filter(i -> i.getId().equals(itemId))
            .findFirst()
            .orElseThrow(
                () ->
                    new InvalidRequestException(
                        "Item não pertence ao pedido."));
    if (returns.existsByOrderItemId(itemId)
        || returns.existsByOrderIdAndOrderItemIsNull(orderId))
      throw new InvalidRequestException(
          "Já existe uma devolução para este item.");
    return returns.save(new ReturnRequest(item, reason.trim()));
  }

  @Transactional
  public ReturnRequest status(Long id, ReturnStatus status) {
    return status(id, status, true);
  }

  @Transactional
  public ReturnRequest status(
      Long id, ReturnStatus status, Boolean restockItems) {
    ReturnRequest r = getForUpdate(id);
    if (status == null) throw new InvalidRequestException("Informe o status.");
    if (status != ReturnStatus.TROCA_AUTORIZADA
        && status != ReturnStatus.TROCA_NEGADA
        && status != ReturnStatus.TROCADO)
      throw new InvalidRequestException(
          "O administrador só pode autorizar, "
              + "negar ou confirmar o recebimento da troca.");
    if (status == ReturnStatus.TROCADO) {
      if (r.getStatus() != ReturnStatus.TROCA_AUTORIZADA)
        throw new InvalidRequestException(
            "A troca precisa ser autorizada antes do recebimento.");
      long credit =
          r.targetItems().stream()
              .mapToLong(item -> item.getUnitPriceCents() * item.getQuantity())
              .sum();
      Coupon coupon =
          coupons.save(
              Coupon.returnCredit(
                  "TROCA-"
                      + UUID.randomUUID()
                          .toString()
                          .substring(0, 8)
                          .toUpperCase(),
                  r.targetOrder().getCustomer(),
                  credit));
      boolean restock = restockItems == null || restockItems;
      if (restock)
        r.targetItems().stream()
            .sorted(java.util.Comparator.comparing(OrderItem::getVariantId))
            .forEach(
                item ->
                    variants
                        .findWithLockById(item.getVariantId())
                        .ifPresent(
                            v ->
                                v.updateStock(
                                    v.getStockQuantity()
                                        + item.getQuantity())));
      r.issue(coupon, restock);
      if (r.getOrderItem() == null) r.targetOrder().completeWholeExchange();
    } else {
      r.changeStatus(status);
      if (r.getOrderItem() == null) {
        if (status == ReturnStatus.TROCA_AUTORIZADA)
          r.targetOrder().authorizeWholeExchange();
        else r.targetOrder().denyWholeExchange();
      }
      if (status == ReturnStatus.TROCA_AUTORIZADA) {
        notifications.notify(
            r.targetOrder().getCustomer(),
            "RETURN_AUTHORIZED",
            "Sua troca foi autorizada.",
            "/pedidos/" + r.targetOrder().getId());
      } else {
        notifications.notify(
            r.targetOrder().getCustomer(),
            "RETURN_DENIED",
            "Sua solicitação de troca foi negada.",
            "/pedidos/" + r.targetOrder().getId());
      }
    }
    return returns.save(r);
  }

  @Transactional
  public ReturnRequest dispatch(
      Long customerId, Long id, String trackingCode) {
    String normalizedCode =
        trackingCode == null ? null : trackingCode.trim();
    if (normalizedCode == null || normalizedCode.isBlank())
      throw new InvalidRequestException("Informe o código de rastreio.");
    if (normalizedCode.length() > 100)
      throw new InvalidRequestException(
          "O código de rastreio deve ter até 100 caracteres.");
    ReturnRequest request = getForUpdate(id);
    ensureOwner(request, customerId);
    if (request.getStatus() != ReturnStatus.TROCA_AUTORIZADA)
      throw new InvalidRequestException(
          "A devolução precisa ser autorizada antes do envio.");
    request.registerTrackingCode(normalizedCode);
    return returns.save(request);
  }

  @Transactional(readOnly = true)
  public List<ReturnRequest> all() {
    return returns.findAllByOrderByCreatedAtDesc();
  }

  @Transactional(readOnly = true)
  public List<ReturnRequest> customerReturns(Long customerId) {
    return returns.findByCustomerIdOrderByCreatedAtDesc(customerId);
  }

  @Transactional(readOnly = true)
  public ReturnRequest get(Long id) {
    return returns
        .findById(id)
        .orElseThrow(
            () -> new InvalidRequestException("Devolução não encontrada."));
  }

  private ReturnRequest getForUpdate(Long id) {
    return returns.findForUpdate(id)
        .orElseThrow(
            () -> new InvalidRequestException("Devolução não encontrada."));
  }

  private void ensureOwner(ReturnRequest r, Long customerId) {
    if (!r.targetOrder().getCustomer().getId().equals(customerId))
      throw new InvalidRequestException("Devolução não pertence ao cliente.");
  }
}

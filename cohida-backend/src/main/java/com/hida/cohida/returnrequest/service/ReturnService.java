package com.hida.cohida.returnrequest.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.service.OrderService;
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
    private final OrderService orders;
    private final CouponRepository coupons;
    private final ProductVariantRepository variants;
    private final NotificationService notifications;

    public ReturnService(ReturnRequestRepository returns, OrderService orders, CouponRepository coupons, ProductVariantRepository variants, NotificationService notifications) {
        this.returns = returns;
        this.orders = orders;
        this.coupons = coupons;
        this.variants = variants;
        this.notifications = notifications;
    }

    @Transactional
    public ReturnRequest request(Long customerId, Long orderId, Long itemId, String reason) {
        if (reason == null || reason.isBlank()) throw new InvalidRequestException("Informe o motivo da devolução.");
        SaleOrder order = orders.customerOrder(customerId, orderId);
        if (order.getStatus() != OrderStatus.ENTREGUE)
            throw new InvalidRequestException("A devolução só pode ser solicitada após a entrega.");
        if (itemId == null) {
            if (returns.existsByOrderId(orderId)) throw new InvalidRequestException("Já existe uma troca para este pedido.");
            return returns.save(new ReturnRequest(order, reason.trim()));
        }
        OrderItem item = order.getItems().stream().filter(i -> i.getId().equals(itemId)).findFirst().orElseThrow(() -> new InvalidRequestException("Item não pertence ao pedido."));
        if (returns.existsByOrderItemId(itemId))
            throw new InvalidRequestException("Já existe uma devolução para este item.");
        return returns.save(new ReturnRequest(item, reason.trim()));
    }

    @Transactional
    public ReturnRequest status(Long id, ReturnStatus status) {
        return status(id, status, true);
    }

    @Transactional
    public ReturnRequest status(Long id, ReturnStatus status, Boolean restockItems) {
        ReturnRequest r = get(id);
        if (status == null) throw new InvalidRequestException("Informe o status.");
        if (status != ReturnStatus.TROCA_AUTORIZADA && status != ReturnStatus.TROCA_NEGADA && status != ReturnStatus.TROCADO)
            throw new InvalidRequestException("O administrador só pode autorizar, negar ou confirmar o recebimento da troca.");
        if (status == ReturnStatus.TROCADO) {
            if (r.getStatus() != ReturnStatus.TROCA_AUTORIZADA)
                throw new InvalidRequestException("A troca precisa ser autorizada antes do recebimento.");
            long credit = r.targetItems().stream().mapToLong(item -> item.getUnitPriceCents() * item.getQuantity()).sum();
            Coupon coupon = coupons.save(Coupon.returnCredit("TROCA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(), r.targetOrder().getCustomer(), credit));
            boolean restock = restockItems == null || restockItems;
            if (restock) r.targetItems().forEach(item -> variants.findWithLockById(item.getVariantId()).ifPresent(v -> v.updateStock(v.getStockQuantity() + item.getQuantity())));
            r.issue(coupon, restock);
        } else {
            r.changeStatus(status);
            if (status == ReturnStatus.TROCA_AUTORIZADA) {
                notifications.notify(r.targetOrder().getCustomer(), "RETURN_AUTHORIZED", "Sua troca foi autorizada.", "/pedidos/" + r.targetOrder().getId());
            } else {
                notifications.notify(r.targetOrder().getCustomer(), "RETURN_DENIED", "Sua solicitação de troca foi negada.", "/pedidos/" + r.targetOrder().getId());
            }
        }
        return returns.save(r);
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
        return returns.findById(id).orElseThrow(() -> new InvalidRequestException("Devolução não encontrada."));
    }

    private void ensureOwner(ReturnRequest r, Long customerId) {
        if (!r.targetOrder().getCustomer().getId().equals(customerId))
            throw new InvalidRequestException("Devolução não pertence ao cliente.");
    }
}

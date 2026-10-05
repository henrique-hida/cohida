package com.hida.cohida.returnrequest.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.service.OrderService;
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

    public ReturnService(ReturnRequestRepository returns, OrderService orders, CouponRepository coupons, ProductVariantRepository variants) {
        this.returns = returns;
        this.orders = orders;
        this.coupons = coupons;
        this.variants = variants;
    }

    @Transactional
    public ReturnRequest request(Long customerId, Long orderId, Long itemId, String reason) {
        if (reason == null || reason.isBlank()) throw new InvalidRequestException("Informe o motivo da devolução.");
        SaleOrder order = orders.customerOrder(customerId, orderId);
        if (order.getStatus() != OrderStatus.ENTREGUE)
            throw new InvalidRequestException("A devolução só pode ser solicitada após a entrega.");
        OrderItem item = order.getItems().stream().filter(i -> i.getId().equals(itemId)).findFirst().orElseThrow(() -> new InvalidRequestException("Item não pertence ao pedido."));
        if (returns.existsByOrderItemId(itemId))
            throw new InvalidRequestException("Já existe uma devolução para este item.");
        return returns.save(new ReturnRequest(item, reason.trim()));
    }

    @Transactional
    public ReturnRequest dispatch(Long customerId, Long id, String code) {
        ReturnRequest r = get(id);
        ensureOwner(r, customerId);
        if (code == null || code.isBlank()) throw new InvalidRequestException("Informe o código de rastreio.");
        r.dispatch(code.trim());
        return returns.save(r);
    }

    @Transactional
    public ReturnRequest status(Long id, ReturnStatus status) {
        ReturnRequest r = get(id);
        if (status == null) throw new InvalidRequestException("Informe o status.");
        if (status == ReturnStatus.PROCESSADA) {
            if (r.getStatus() != ReturnStatus.ITEM_RECEBIDO)
                throw new InvalidRequestException("O item precisa ser recebido antes do processamento.");
            long credit = r.getOrderItem().getUnitPriceCents() * r.getOrderItem().getQuantity();
            Coupon coupon = coupons.save(Coupon.returnCredit("TROCA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(), r.getOrderItem().getOrder().getCustomer(), credit));
            variants.findWithLockById(r.getOrderItem().getVariantId()).ifPresent(v -> v.updateStock(v.getStockQuantity() + r.getOrderItem().getQuantity()));
            r.issue(coupon);
        } else r.changeStatus(status);
        return returns.save(r);
    }

    @Transactional(readOnly = true)
    public List<ReturnRequest> all() {
        return returns.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ReturnRequest> customerReturns(Long customerId) {
        return returns.findByOrderItemOrderCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional(readOnly = true)
    public ReturnRequest get(Long id) {
        return returns.findById(id).orElseThrow(() -> new InvalidRequestException("Devolução não encontrada."));
    }

    private void ensureOwner(ReturnRequest r, Long customerId) {
        if (!r.getOrderItem().getOrder().getCustomer().getId().equals(customerId))
            throw new InvalidRequestException("Devolução não pertence ao cliente.");
    }
}

package com.hida.cohida.order.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.cart.domain.Cart;
import com.hida.cohida.cart.domain.CartItem;
import com.hida.cohida.cart.service.CartService;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.domain.CustomerAddress;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.notification.service.NotificationService;
import com.hida.cohida.order.domain.OrderItem;
import com.hida.cohida.order.domain.OrderStatus;
import com.hida.cohida.order.domain.SaleOrder;
import com.hida.cohida.order.exception.OrderNotFoundException;
import com.hida.cohida.order.dto.PaymentAllocationRequest;
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.paymentcard.domain.PaymentCard;
import com.hida.cohida.paymentcard.exception.PaymentCardNotFoundException;
import com.hida.cohida.paymentcard.repository.PaymentCardRepository;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {
    private final OrderRepository orders;
    private final CartService carts;
    private final CustomerRepository customers;
    private final PaymentCardRepository cards;
    private final ProductVariantRepository variants;
    private final CouponRepository coupons;
    private final NotificationService notifications;

    public OrderService(OrderRepository orders, CartService carts, CustomerRepository customers, PaymentCardRepository cards, ProductVariantRepository variants, CouponRepository coupons, NotificationService notifications) {
        this.orders = orders;
        this.carts = carts;
        this.customers = customers;
        this.cards = cards;
        this.variants = variants;
        this.coupons = coupons;
        this.notifications = notifications;
    }

    @Transactional
    public SaleOrder checkout(Long customerId, Long addressId, Long cardId) {
        if (cardId == null) throw new InvalidRequestException("Selecione ao menos um cartão.");
        return checkout(customerId, addressId, List.of(new PaymentAllocationRequest(cardId, null)));
    }

    @Transactional
    public SaleOrder checkout(Long customerId, Long addressId, List<PaymentAllocationRequest> requestedPayments) {
        if (addressId == null)
            throw new InvalidRequestException("Selecione o endereço de entrega.");
        Cart cart = carts.cart(customerId);
        if (cart.getItems().isEmpty()) throw new InvalidRequestException("O carrinho está vazio.");
        Customer customer = customers.findWithDetailsById(customerId).orElseThrow(() -> new InvalidRequestException("Cliente não encontrado."));
        CustomerAddress address = customer.address(addressId);
        Coupon coupon = cart.getCoupon() == null ? null : coupons.findWithLockById(cart.getCoupon().getId()).orElseThrow(() -> new InvalidRequestException("Cupom inválido."));
        long subtotal = 0;
        for (CartItem item : cart.getItems()) {
            ProductVariant variant = variants.findWithLockById(item.getVariant().getId()).orElseThrow(() -> new InvalidRequestException("Variação não encontrada."));
            if (!variant.getProduct().isActive() || item.getQuantity() > variant.getStockQuantity())
                throw new InvalidRequestException("Estoque insuficiente para " + variant.getSku() + ".");
            subtotal += variant.getPriceCents() * item.getQuantity();
        }
        if (coupon != null) cart.applyCoupon(coupon);
        long couponValue = carts.couponValue(cart);
        long discount = carts.discount(cart);
        long total = subtotal - discount;
        List<PaymentAllocationRequest> allocations = validateAllocations(requestedPayments, total);
        List<PaymentCard> selectedCards = new ArrayList<>();
        for (PaymentAllocationRequest allocation : allocations) {
            selectedCards.add(cards.findByIdAndCustomerIdAndDeletedAtIsNull(allocation.paymentCardId(), customerId)
                    .orElseThrow(() -> new PaymentCardNotFoundException(allocation.paymentCardId())));
        }
        PaymentCard primaryCard = selectedCards.getFirst();
        SaleOrder order = new SaleOrder(customer, subtotal, discount, 0, coupon == null ? null : coupon.getCode(), primaryCard.getBrand(), primaryCard.getLastDigits(), address.getLabel(), address.getStreet(), address.getNumber(), address.getNeighborhood(), address.getZipCode(), address.getCity(), address.getState(), address.getCountry());
        order.setCouponValueCents(couponValue);
        for (int index = 0; index < allocations.size(); index++) {
            order.addPayment(selectedCards.get(index), allocations.get(index).amountCents());
        }
        for (CartItem item : cart.getItems()) {
            ProductVariant variant = variants.findWithLockById(item.getVariant().getId()).orElseThrow();
            variant.updateStock(variant.getStockQuantity() - item.getQuantity());
            order.addItem(new OrderItem(variant.getId(), variant.getProduct().getName(), variant.getSku(), variant.getLabel(), variant.getPriceCents(), item.getQuantity()));
        }
        if (coupon != null) {
            if (coupon.isReturnCredit()) coupon.consumeCredit(couponValue);
            else coupon.registerRedemption();
        }
        long surplusCredit = Math.max(0, couponValue - subtotal);
        if (surplusCredit > 0) {
            Coupon issued = coupons.save(Coupon.returnCredit(
                    "TROCA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                    customer,
                    surplusCredit));
            order.issueCoupon(issued);
        }
        SaleOrder saved = orders.save(order);
        cart.clear();
        notifications.notify(customer, "ORDER_CREATED", "Seu pedido foi criado.", "/pedidos/" + saved.getId());
        return saved;
    }

    private static List<PaymentAllocationRequest> validateAllocations(
            List<PaymentAllocationRequest> requestedPayments,
            long totalCents
    ) {
        if (totalCents > 0 && totalCents < 1_000)
            throw new InvalidRequestException("O valor cobrado no cartão deve ser de no mínimo R$ 10,00.");
        if (requestedPayments == null || requestedPayments.isEmpty())
            throw new InvalidRequestException("Informe ao menos um cartão de crédito.");

        List<PaymentAllocationRequest> normalizedPayments = requestedPayments;
        if (requestedPayments.size() == 1 && requestedPayments.getFirst() != null
                && requestedPayments.getFirst().amountCents() == null) {
            normalizedPayments = List.of(new PaymentAllocationRequest(
                    requestedPayments.getFirst().paymentCardId(), totalCents));
        }
        Set<Long> cardIds = new HashSet<>();
        long allocatedCents = 0;
        for (PaymentAllocationRequest payment : normalizedPayments) {
            if (payment == null || payment.paymentCardId() == null || payment.amountCents() == null
                    || payment.amountCents() < 0 || !cardIds.add(payment.paymentCardId()))
                throw new InvalidRequestException("Informe cartões e valores válidos para o pagamento.");
            if (totalCents > 0 && payment.amountCents() < 1_000)
                throw new InvalidRequestException("O valor pago em cada cartão deve ser de no mínimo R$ 10,00.");
            allocatedCents += payment.amountCents();
        }
        if (allocatedCents != totalCents)
            throw new InvalidRequestException("Os valores dos cartões devem totalizar o valor do pedido.");
        if (totalCents == 0 && normalizedPayments.size() > 1)
            throw new InvalidRequestException("Um pedido sem valor a pagar aceita somente um cartão.");
        return normalizedPayments;
    }

    @Transactional(readOnly = true)
    public List<SaleOrder> customerOrders(Long customerId) {
        return orders.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    @Transactional(readOnly = true)
    public SaleOrder customerOrder(Long customerId, Long id) {
        return orders.findByIdAndCustomerId(id, customerId).orElseThrow(() -> new OrderNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public List<SaleOrder> adminOrders() {
        return orders.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public SaleOrder adminOrder(Long id) {
        return orders.findById(id).orElseThrow(() -> new OrderNotFoundException(id));
    }

    @Transactional
    public SaleOrder changeStatus(Long id, OrderStatus status) {
        if (status == null) throw new InvalidRequestException("Informe o próximo status do pedido.");
        SaleOrder order = adminOrder(id);
        order.changeStatus(status);
        return orders.save(order);
    }

    @Transactional
    public SaleOrder dispatch(Long id, String trackingCode) {
        if (trackingCode == null || trackingCode.isBlank())
            throw new InvalidRequestException("Informe o código de rastreio.");
        SaleOrder order = adminOrder(id);
        order.dispatch(trackingCode.trim());
        SaleOrder saved = orders.save(order);
        notifications.notify(order.getCustomer(), "ORDER_DISPATCHED", "Seu pedido foi despachado.", "/pedidos/" + id);
        return saved;
    }

    @Transactional
    public SaleOrder cancel(Long customerId, Long orderId, String reason) {
        SaleOrder order = customerOrder(customerId, orderId);
        order.cancel(reason == null ? null : reason.trim());
        for (OrderItem item : order.getItems()) {
            ProductVariant variant = variants.findWithLockById(item.getVariantId()).orElseThrow();
            variant.updateStock(variant.getStockQuantity() + item.getQuantity());
        }
        if (order.getCouponCode() != null) coupons.findByCode(order.getCouponCode()).ifPresent(coupon -> {
            if (coupon.isReturnCredit()) coupon.restoreCredit(order.getCouponValueCents());
            else coupon.revertRedemption();
        });
        if (order.getIssuedCoupon() != null) order.getIssuedCoupon().deactivate();
        SaleOrder saved = orders.save(order);
        notifications.notify(order.getCustomer(), "ORDER_CANCELLED", "Seu pedido foi cancelado.", "/pedidos/" + orderId);
        return saved;
    }

    @Transactional
    public SaleOrder confirmReceipt(Long customerId, Long orderId) {
        SaleOrder order = customerOrder(customerId, orderId);
        if (order.getStatus() != OrderStatus.EM_TRANSITO)
            throw new InvalidRequestException("A confirmação está disponível somente para pedidos em trânsito.");
        order.changeStatus(OrderStatus.ENTREGUE);
        return orders.save(order);
    }
}

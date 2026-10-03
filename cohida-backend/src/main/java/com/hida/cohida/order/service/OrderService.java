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
import com.hida.cohida.order.repository.OrderRepository;
import com.hida.cohida.paymentcard.domain.PaymentCard;
import com.hida.cohida.paymentcard.exception.PaymentCardNotFoundException;
import com.hida.cohida.paymentcard.repository.PaymentCardRepository;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        if (addressId == null || cardId == null)
            throw new InvalidRequestException("Selecione o endereço de entrega e o cartão.");
        Cart cart = carts.cart(customerId);
        if (cart.getItems().isEmpty()) throw new InvalidRequestException("O carrinho está vazio.");
        Customer customer = customers.findWithDetailsById(customerId).orElseThrow(() -> new InvalidRequestException("Cliente não encontrado."));
        CustomerAddress address = customer.address(addressId);
        PaymentCard card = cards.findByIdAndCustomerIdAndDeletedAtIsNull(cardId, customerId).orElseThrow(() -> new PaymentCardNotFoundException(cardId));
        Coupon coupon = cart.getCoupon() == null ? null : coupons.findWithLockById(cart.getCoupon().getId()).orElseThrow(() -> new InvalidRequestException("Cupom inválido."));
        long subtotal = 0;
        for (CartItem item : cart.getItems()) {
            ProductVariant variant = variants.findWithLockById(item.getVariant().getId()).orElseThrow(() -> new InvalidRequestException("Variação não encontrada."));
            if (!variant.getProduct().isActive() || item.getQuantity() > variant.getStockQuantity())
                throw new InvalidRequestException("Estoque insuficiente para " + variant.getSku() + ".");
            subtotal += variant.getPriceCents() * item.getQuantity();
        }
        if (coupon != null) cart.applyCoupon(coupon);
        long discount = carts.discount(cart);
        SaleOrder order = new SaleOrder(customer, subtotal, discount, 0, coupon == null ? null : coupon.getCode(), card.getBrand(), card.getLastDigits(), address.getLabel(), address.getStreet(), address.getNumber(), address.getNeighborhood(), address.getZipCode(), address.getCity(), address.getState(), address.getCountry());
        for (CartItem item : cart.getItems()) {
            ProductVariant variant = variants.findWithLockById(item.getVariant().getId()).orElseThrow();
            variant.updateStock(variant.getStockQuantity() - item.getQuantity());
            order.addItem(new OrderItem(variant.getId(), variant.getProduct().getName(), variant.getSku(), variant.getLabel(), variant.getPriceCents(), item.getQuantity()));
        }
        if (coupon != null) {
            if (coupon.isReturnCredit()) coupon.consumeCredit(discount);
            else coupon.registerRedemption();
        }
        SaleOrder saved = orders.save(order);
        cart.clear();
        notifications.notify(customer, "ORDER_CREATED", "Seu pedido foi criado.", "/pedidos/" + saved.getId());
        return saved;
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
            if (coupon.isReturnCredit()) coupon.restoreCredit(order.getDiscountCents());
            else coupon.revertRedemption();
        });
        SaleOrder saved = orders.save(order);
        notifications.notify(order.getCustomer(), "ORDER_CANCELLED", "Seu pedido foi cancelado.", "/pedidos/" + orderId);
        return saved;
    }
}

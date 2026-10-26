package com.hida.cohida.cart.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.cart.domain.Cart;
import com.hida.cohida.cart.domain.CartItem;
import com.hida.cohida.cart.dto.CartResponse;
import com.hida.cohida.cart.repository.CartRepository;
import com.hida.cohida.cart.repository.ExpiredCartItemRepository;
import com.hida.cohida.cart.dto.ExpiredCartItemResponse;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.exception.CustomerNotFoundException;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
public class CartService {
    private final CartRepository carts;
    private final CustomerRepository customers;
    private final ProductVariantRepository variants;
    private final CouponRepository coupons;
    private final long reservationMinutes;
    private final ExpiredCartItemRepository expiredItems;

    public CartService(CartRepository carts, CustomerRepository customers, ProductVariantRepository variants, CouponRepository coupons,
                       @Value("${cohida.cart.reservation-minutes:30}") long reservationMinutes, ExpiredCartItemRepository expiredItems) {
        this.carts = carts;
        this.customers = customers;
        this.variants = variants;
        this.coupons = coupons;
        this.reservationMinutes = reservationMinutes;
        this.expiredItems = expiredItems;
    }

    @Transactional
    public Cart cart(Long customerId) {
        return carts.findByCustomerId(customerId).orElseGet(() -> carts.save(new Cart(activeCustomer(customerId))));
    }

    @Transactional
    public CartResponse view(Long customerId) {
        Cart cart = carts.findByCustomerId(customerId).orElse(null);
        if (cart == null) return new CartResponse(null, java.util.List.of(), null, java.util.List.of(), 0, 0, 0, 0);
        expire(cart);
        return CartResponse.from(carts.save(cart), discount(cart));
    }

    @Transactional
    public CartResponse add(Long customerId, Long variantId, Integer quantity) {
        int q = quantity(quantity);
        Cart cart = cart(customerId);
        ProductVariant variant = variant(variantId);
        expire(cart);
        cart.add(variant, q, reservationUntil());
        ensureStock(cart);
        return CartResponse.from(carts.save(cart), discount(cart));
    }

    @Transactional
    public CartResponse update(Long customerId, Long itemId, Integer quantity) {
        Cart cart = cart(customerId);
        expire(cart);
        CartItem item = cart.item(itemId);
        item.reserve(quantity(quantity), reservationUntil());
        ensureStock(cart);
        return CartResponse.from(carts.save(cart), discount(cart));
    }

    @Transactional
    public void remove(Long customerId, Long itemId) {
        Cart cart = cart(customerId);
        cart.remove(itemId);
        carts.save(cart);
    }

    @Transactional
    public void clear(Long customerId) {
        Cart cart = cart(customerId);
        cart.clear();
        carts.save(cart);
    }

    @Transactional(readOnly = true)
    public java.util.List<ExpiredCartItemResponse> expired(Long customerId) {
        return expiredItems.findByCustomerIdAndAcknowledgedAtIsNullOrderByExpiredAtDesc(customerId).stream().map(ExpiredCartItemResponse::from).toList();
    }

    @Transactional
    public void acknowledgeExpired(Long customerId, Long id) {
        var item = expiredItems.findById(id).orElseThrow(() -> new InvalidRequestException("Item expirado não encontrado."));
        if (!item.getCustomer().getId().equals(customerId)) throw new InvalidRequestException("Item expirado não pertence ao cliente.");
        item.acknowledge();
    }

    /** Operational action used when reservations must be released immediately. */
    @Transactional
    public int expireAllReservations() {
        int expiredCount = 0;
        for (Cart cart : carts.findAll()) {
            var expired = cart.expireAllReservations();
            expired.forEach(item -> expiredItems.save(new com.hida.cohida.cart.domain.ExpiredCartItem(
                    cart.getCustomer(), item.getVariant(), item.getQuantity())));
            expiredCount += expired.size();
        }
        return expiredCount;
    }

    @Transactional
    public CartResponse applyCoupon(Long customerId, String code) {
        if (code == null || code.isBlank()) throw new InvalidRequestException("Informe o código do cupom.");
        Cart cart = cart(customerId);
        Coupon coupon = coupons.findByCode(code.trim().toUpperCase()).orElseThrow(() -> new InvalidRequestException("Cupom inválido."));
        if (!coupon.isAvailableTo(customerId)) throw new InvalidRequestException("Este cupom não pertence ao cliente.");
        cart.applyCoupon(coupon);
        long discount = discount(cart);
        return CartResponse.from(carts.save(cart), discount);
    }

    @Transactional
    public CartResponse removeCoupon(Long customerId) {
        Cart cart = cart(customerId);
        cart.removeCoupon();
        return CartResponse.from(carts.save(cart), 0);
    }

    @Transactional
    public CartResponse removeCoupon(Long customerId, String code) {
        Cart cart = cart(customerId);
        cart.removeCoupon(code);
        return CartResponse.from(carts.save(cart), discount(cart));
    }

    public long couponValue(Cart cart) {
        long subtotal = cart.getItems().stream().mapToLong(item -> item.getVariant().getPriceCents() * item.getQuantity()).sum();
        return cart.getCoupons().stream().mapToLong(coupon -> couponValue(coupon, subtotal)).sum();
    }

    public long discount(Cart cart) {
        return couponValue(cart);
    }

    private long couponValue(Coupon coupon, long subtotal) {
        if (!coupon.isCurrentlyValid(LocalDateTime.now())) throw new InvalidRequestException("O cupom não está mais válido.");
        if (coupon.getMinimumOrderValueCents() != null && subtotal < coupon.getMinimumOrderValueCents()) throw new InvalidRequestException("O valor mínimo do cupom não foi atingido.");
        long value = coupon.isReturnCredit() ? coupon.getRemainingCreditCents() : coupon.getDiscountCents() == null ? BigDecimal.valueOf(subtotal).multiply(coupon.getDiscountPercentage()).divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN).longValue() : coupon.getDiscountCents();
        return coupon.getMaximumDiscountCents() == null ? value : Math.min(value, coupon.getMaximumDiscountCents());
    }

    public void ensureStock(Cart cart) {
        for (CartItem item : cart.getItems()) {
            long reservedByOtherCarts = carts.activeReservationQuantity(item.getVariant().getId(), cart.getId(), LocalDateTime.now());
            if (!item.getVariant().getProduct().isActive() || item.getQuantity() > item.getVariant().getStockQuantity() - reservedByOtherCarts)
                throw new InvalidRequestException("Uma variação do carrinho não possui estoque suficiente.");
        }
    }

    /** Reconciles a stale cart with current physical stock at checkout. */
    @Transactional
    public boolean reconcileStockAtCheckout(Cart cart) {
        boolean changed = false;
        for (CartItem item : new java.util.ArrayList<>(cart.getItems())) {
            ProductVariant variant = variants.findWithLockById(item.getVariant().getId()).orElseThrow();
            long available = Math.max(0, variant.getStockQuantity()
                    - carts.activeReservationQuantity(variant.getId(), cart.getId(), LocalDateTime.now()));
            if (item.getQuantity() <= available) continue;
            changed = true;
            if (available == 0) cart.remove(item.getId());
            else item.reserve((int) available, item.getReservedUntil());
        }
        if (changed) carts.save(cart);
        return changed;
    }

    private void expire(Cart cart) {
        cart.removeExpiredProducts(LocalDateTime.now()).forEach(item ->
                expiredItems.save(new com.hida.cohida.cart.domain.ExpiredCartItem(
                        cart.getCustomer(), item.getVariant(), item.getQuantity())));
    }

    private LocalDateTime reservationUntil() {
        return LocalDateTime.now().plusMinutes(reservationMinutes);
    }

    private Customer activeCustomer(Long id) {
        Customer c = customers.findById(id).orElseThrow(() -> new CustomerNotFoundException(id));
        if (!c.isActive()) throw new InvalidRequestException("A conta do cliente está desativada.");
        return c;
    }

    private ProductVariant variant(Long id) {
        return variants.findById(id).orElseThrow(() -> new InvalidRequestException("Variação não encontrada."));
    }

    private int quantity(Integer q) {
        if (q == null || q <= 0) throw new InvalidRequestException("A quantidade deve ser maior que zero.");
        return q;
    }
}

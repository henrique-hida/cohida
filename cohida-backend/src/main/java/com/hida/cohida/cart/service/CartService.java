package com.hida.cohida.cart.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.cart.domain.Cart;
import com.hida.cohida.cart.domain.CartItem;
import com.hida.cohida.cart.dto.CartResponse;
import com.hida.cohida.cart.repository.CartRepository;
import com.hida.cohida.coupon.domain.Coupon;
import com.hida.cohida.coupon.repository.CouponRepository;
import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.customer.exception.CustomerNotFoundException;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
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

    public CartService(CartRepository carts, CustomerRepository customers, ProductVariantRepository variants, CouponRepository coupons) {
        this.carts = carts;
        this.customers = customers;
        this.variants = variants;
        this.coupons = coupons;
    }

    @Transactional
    public Cart cart(Long customerId) {
        return carts.findByCustomerId(customerId).orElseGet(() -> carts.save(new Cart(activeCustomer(customerId))));
    }

    @Transactional(readOnly = true)
    public CartResponse view(Long customerId) {
        Cart cart = carts.findByCustomerId(customerId).orElse(null);
        return cart == null ? new CartResponse(null, java.util.List.of(), null, 0, 0, 0, 0) : CartResponse.from(cart, discount(cart));
    }

    @Transactional
    public CartResponse add(Long customerId, Long variantId, Integer quantity) {
        int q = quantity(quantity);
        Cart cart = cart(customerId);
        ProductVariant variant = variant(variantId);
        cart.add(variant, q);
        ensureStock(cart);
        return CartResponse.from(carts.save(cart), discount(cart));
    }

    @Transactional
    public CartResponse update(Long customerId, Long itemId, Integer quantity) {
        Cart cart = cart(customerId);
        CartItem item = cart.item(itemId);
        item.setQuantity(quantity(quantity));
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

    public long couponValue(Cart cart) {
        long subtotal = cart.getItems().stream().mapToLong(item -> item.getVariant().getPriceCents() * item.getQuantity()).sum();
        Coupon coupon = cart.getCoupon();
        if (coupon == null) return 0;
        if (!coupon.isCurrentlyValid(LocalDateTime.now()))
            throw new InvalidRequestException("O cupom não está mais válido.");
        if (coupon.getMinimumOrderValueCents() != null && subtotal < coupon.getMinimumOrderValueCents())
            throw new InvalidRequestException("O valor mínimo do cupom não foi atingido.");
        long value = coupon.isReturnCredit() ? coupon.getRemainingCreditCents() : coupon.getDiscountCents() == null ? BigDecimal.valueOf(subtotal).multiply(coupon.getDiscountPercentage()).divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN).longValue() : coupon.getDiscountCents();
        if (coupon.getMaximumDiscountCents() != null) value = Math.min(value, coupon.getMaximumDiscountCents());
        return value;
    }

    public long discount(Cart cart) {
        long subtotal = cart.getItems().stream().mapToLong(item -> item.getVariant().getPriceCents() * item.getQuantity()).sum();
        return Math.min(couponValue(cart), subtotal);
    }

    public void ensureStock(Cart cart) {
        for (CartItem item : cart.getItems()) {
            if (!item.getVariant().getProduct().isActive() || item.getQuantity() > item.getVariant().getStockQuantity())
                throw new InvalidRequestException("Uma variação do carrinho não possui estoque suficiente.");
        }
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

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

import java.time.LocalDateTime;

@Service
public class CartService {
  private final CartRepository carts;
  private final CustomerRepository customers;
  private final ProductVariantRepository variants;
  private final CouponRepository coupons;
  private final long reservationMinutes;
  private final ExpiredCartItemRepository expiredItems;
  private final CartPricing pricing;
  private final CartReservationService reservations;

  public CartService(
      CartRepository carts,
      CustomerRepository customers,
      ProductVariantRepository variants,
      CouponRepository coupons,
      @Value("${cohida.cart.reservation-minutes:30}") long reservationMinutes,
      ExpiredCartItemRepository expiredItems,
      CartPricing pricing, CartReservationService reservations) {
    this.carts = carts;
    this.customers = customers;
    this.variants = variants;
    this.coupons = coupons;
    this.reservationMinutes = reservationMinutes;
    this.expiredItems = expiredItems;
    this.pricing = pricing;
    this.reservations = reservations;
  }

  @Transactional
  public Cart cart(Long customerId) {
    Customer customer =
        customers.findForCartUpdate(customerId)
            .orElseThrow(() -> new CustomerNotFoundException(customerId));
    return carts
        .findForUpdateByCustomerId(customerId)
        .orElseGet(() -> {
          if (!customer.isActive())
            throw new InvalidRequestException(
                "A conta do cliente está desativada.");
          return carts.save(new Cart(customer));
        });
  }

  @Transactional
  public CartResponse view(Long customerId) {
    customers.findForCartUpdate(customerId)
        .orElseThrow(() -> new CustomerNotFoundException(customerId));
    Cart cart = carts.findForUpdateByCustomerId(customerId).orElse(null);
    if (cart == null)
      return new CartResponse(
          null, java.util.List.of(), null, java.util.List.of(), 0, 0, 0, 0);
    reservations.expire(cart, LocalDateTime.now());
    return CartResponse.from(carts.save(cart), discount(cart));
  }

  @Transactional
  public CartResponse add(Long customerId, Long variantId, Integer quantity) {
    int q = quantity(quantity);
    if (variantId == null)
      throw new InvalidRequestException("Variação não encontrada.");
    Cart cart = cart(customerId);
    reservations.expire(cart, LocalDateTime.now());
    var variantIds = cart.getItems().stream()
        .map(item -> item.getVariant().getId())
        .collect(
            java.util.stream.Collectors.toCollection(java.util.TreeSet::new));
    variantIds.add(variantId);
    ProductVariant variant = null;
    for (Long id : variantIds) {
      ProductVariant locked = variants.findWithLockById(id)
          .orElseThrow(
              () -> new InvalidRequestException("Variação não encontrada."));
      if (id.equals(variantId)) variant = locked;
    }
    cart.add(variant, q, reservationUntil());
    ensureStock(cart);
    return CartResponse.from(carts.save(cart), discount(cart));
  }

  @Transactional
  public CartResponse update(Long customerId, Long itemId, Integer quantity) {
    Cart cart = cart(customerId);
    reservations.expire(cart, LocalDateTime.now());
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
    return expiredItems
        .findByCustomerIdAndAcknowledgedAtIsNullOrderByExpiredAtDesc(customerId)
        .stream()
        .map(ExpiredCartItemResponse::from)
        .toList();
  }

  @Transactional
  public void acknowledgeExpired(Long customerId, Long id) {
    var item =
        expiredItems
            .findById(id)
            .orElseThrow(
                () ->
                    new InvalidRequestException(
                        "Item expirado não encontrado."));
    if (!item.getCustomer().getId().equals(customerId))
      throw new InvalidRequestException(
          "Item expirado não pertence ao cliente.");
    item.acknowledge();
  }

  /** Operational action used when reservations must be released immediately. */
  @Transactional
  public int expireAllReservations() {
    int expiredCount = 0;
    long after = 0;
    while (true) {
      var customerIds = carts.findCustomerIdsAfter(after,
          org.springframework.data.domain.PageRequest.of(0, 100));
      if (customerIds.isEmpty()) return expiredCount;
      for (Long customerId : customerIds) {
        expiredCount += reservations.releaseAllForCustomer(customerId);
      }
      after = customerIds.getLast();
    }
  }

  @Transactional
  public CartResponse applyCoupon(Long customerId, String code) {
    if (code == null || code.isBlank())
      throw new InvalidRequestException("Informe o código do cupom.");
    Cart cart = cart(customerId);
    Coupon coupon =
        coupons
            .findByCode(code.trim().toUpperCase())
            .orElseThrow(() -> new InvalidRequestException("Cupom inválido."));
    if (!coupon.isAvailableTo(customerId))
      throw new InvalidRequestException("Este cupom não pertence ao cliente.");
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
    return pricing.couponValue(cart, LocalDateTime.now());
  }

  public long discount(Cart cart) {
    return couponValue(cart);
  }

  public void ensureStock(Cart cart) {
    reservations.ensureStock(cart);
  }

  /** Reconciles a stale cart with current physical stock at checkout. */
  @Transactional
  public boolean reconcileStockAtCheckout(Cart cart) {
    return reservations.reconcile(cart);
  }

  private LocalDateTime reservationUntil() {
    return LocalDateTime.now().plusMinutes(reservationMinutes);
  }

  private int quantity(Integer q) {
    if (q == null || q <= 0)
      throw new InvalidRequestException(
          "A quantidade deve ser maior que zero.");
    return q;
  }
}

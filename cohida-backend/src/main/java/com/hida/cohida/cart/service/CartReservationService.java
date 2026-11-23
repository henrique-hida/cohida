package com.hida.cohida.cart.service;

import com.hida.cohida.auth.exception.InvalidRequestException;
import com.hida.cohida.cart.domain.Cart;
import com.hida.cohida.cart.domain.CartItem;
import com.hida.cohida.cart.domain.ExpiredCartItem;
import com.hida.cohida.cart.repository.CartRepository;
import com.hida.cohida.cart.repository.ExpiredCartItemRepository;
import com.hida.cohida.customer.repository.CustomerRepository;
import com.hida.cohida.notification.service.NotificationService;
import com.hida.cohida.product.domain.ProductVariant;
import com.hida.cohida.product.repository.ProductVariantRepository;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartReservationService {
  private final CartRepository carts;
  private final CustomerRepository customers;
  private final ProductVariantRepository variants;
  private final ExpiredCartItemRepository expired;
  private final NotificationService notifications;

  public CartReservationService(CartRepository carts,
      CustomerRepository customers, ProductVariantRepository variants,
      ExpiredCartItemRepository expired, NotificationService notifications) {
    this.carts = carts;
    this.customers = customers;
    this.variants = variants;
    this.expired = expired;
    this.notifications = notifications;
  }

  @Transactional
  public void processDue(Long customerId, LocalDateTime now) {
    var cart = lockedCart(customerId);
    if (cart == null) return;
    cart.getItems().stream().filter(item -> item.needsExpiryWarning(now))
        .forEach(item -> {
          item.markExpiryWarningSent();
          notifications.notify(cart.getCustomer(), "CART_RESERVATION_EXPIRING",
              "Um item do seu carrinho expira em até 5 minutos.", "/carrinho");
        });
    expire(cart, now);
  }

  @Transactional
  public int releaseAllForCustomer(Long customerId) {
    var cart = lockedCart(customerId);
    if (cart == null) return 0;
    var items = cart.expireAllReservations();
    recordExpired(cart, items);
    return items.size();
  }

  private Cart lockedCart(Long customerId) {
    if (customers.findForCartUpdate(customerId).isEmpty()) return null;
    return carts.findForUpdateByCustomerId(customerId).orElse(null);
  }

  public boolean expire(Cart cart, LocalDateTime now) {
    var items = cart.removeExpiredProducts(now);
    recordExpired(cart, items);
    return !items.isEmpty();
  }

  private void recordExpired(Cart cart, java.util.List<CartItem> items) {
    items.forEach(item -> expired.save(new ExpiredCartItem(
        cart.getCustomer(), item.getVariant(), item.getQuantity())));
  }

  public void ensureStock(Cart cart) {
    for (CartItem item : orderedItems(cart)) {
      ProductVariant variant = variants.findWithLockById(
          item.getVariant().getId()).orElseThrow();
      long reserved = carts.activeReservationQuantity(
          variant.getId(), cart.getId(), LocalDateTime.now());
      if (!variant.getProduct().isActive()
          || item.getQuantity() > variant.getStockQuantity() - reserved)
        throw new InvalidRequestException(
            "Uma variação do carrinho não possui estoque suficiente.");
    }
  }

  public boolean reconcile(Cart cart) {
    boolean changed = expire(cart, LocalDateTime.now());
    for (CartItem item : orderedItems(cart)) {
      ProductVariant variant = variants.findWithLockById(
          item.getVariant().getId()).orElseThrow();
      long available = Math.max(0, variant.getStockQuantity()
          - carts.activeReservationQuantity(
              variant.getId(), cart.getId(), LocalDateTime.now()));
      if (item.getQuantity() <= available) continue;
      changed = true;
      if (available == 0) cart.remove(item.getId());
      else item.reserve((int) available, item.getReservedUntil());
    }
    if (changed) carts.save(cart);
    return changed;
  }

  private java.util.List<CartItem> orderedItems(Cart cart) {
    return cart.getItems().stream()
        .sorted(java.util.Comparator.comparing(
            item -> item.getVariant().getId()))
        .toList();
  }
}

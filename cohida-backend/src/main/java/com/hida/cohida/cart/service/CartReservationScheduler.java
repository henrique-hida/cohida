package com.hida.cohida.cart.service;

import com.hida.cohida.cart.domain.ExpiredCartItem;
import com.hida.cohida.cart.repository.CartRepository;
import com.hida.cohida.cart.repository.ExpiredCartItemRepository;
import com.hida.cohida.notification.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class CartReservationScheduler {
    private final CartRepository carts; private final ExpiredCartItemRepository expired; private final NotificationService notifications;
    public CartReservationScheduler(CartRepository carts, ExpiredCartItemRepository expired, NotificationService notifications) { this.carts=carts; this.expired=expired; this.notifications=notifications; }
    @Scheduled(fixedDelayString = "${cohida.cart.reservation-check-ms:60000}") @Transactional
    public void processReservations() {
        var now = LocalDateTime.now();
        carts.findAll().forEach(cart -> {
            cart.getItems().stream().filter(item -> item.needsExpiryWarning(now)).forEach(item -> { item.markExpiryWarningSent(); notifications.notify(cart.getCustomer(), "CART_RESERVATION_EXPIRING", "Um item do seu carrinho expira em até 5 minutos.", "/carrinho"); });
            cart.removeExpiredProducts(now).forEach(item -> expired.save(new ExpiredCartItem(cart.getCustomer(), item.getVariant(), item.getQuantity())));
        });
    }
}

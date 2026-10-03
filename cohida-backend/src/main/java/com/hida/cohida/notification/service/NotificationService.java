package com.hida.cohida.notification.service;

import com.hida.cohida.customer.domain.Customer;
import com.hida.cohida.notification.domain.Notification;
import com.hida.cohida.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository n) {
        notifications = n;
    }

    @Transactional
    public void notify(Customer c, String t, String m, String p) {
        notifications.save(new Notification(c, t, m, p));
    }

    @Transactional(readOnly = true)
    public List<Notification> all(Long id) {
        return notifications.findByCustomerIdOrderByCreatedAtDesc(id);
    }

    @Transactional
    public void read(Long customerId, Long id) {
        notifications.findByIdAndCustomerId(id, customerId).orElseThrow(() -> new IllegalArgumentException("Notificação não encontrada.")).markRead();
    }
}

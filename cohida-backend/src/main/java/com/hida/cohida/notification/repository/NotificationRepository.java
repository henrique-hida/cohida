package com.hida.cohida.notification.repository;

import com.hida.cohida.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByCustomerIdOrderByCreatedAtDesc(Long id);

    Optional<Notification> findByIdAndCustomerId(Long id, Long customerId);
}

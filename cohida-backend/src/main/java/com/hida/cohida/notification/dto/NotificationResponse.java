package com.hida.cohida.notification.dto;

import com.hida.cohida.notification.domain.Notification;

import java.time.LocalDateTime;

public record NotificationResponse(Long id, String type, String message, String targetPath, boolean read,
                                   LocalDateTime createdAt) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getMessage(), n.getTargetPath(), n.isRead(), n.getCreatedAt());
    }
}

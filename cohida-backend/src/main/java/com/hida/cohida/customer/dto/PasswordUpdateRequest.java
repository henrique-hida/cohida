package com.hida.cohida.customer.dto;

public record PasswordUpdateRequest(
        String currentPassword,
        String newPassword,
        String newPasswordConfirmation
) {
}

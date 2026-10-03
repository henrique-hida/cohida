package com.hida.cohida.auth.security;

import com.hida.cohida.account.enums.AccountRole;

public record AuthenticatedCustomer(Long accountId, Long customerId, String email, AccountRole role) {
    /**
     * @deprecated Use customerId() for customer-only endpoints.
     */
    @Deprecated
    public Long id() {
        return customerId;
    }
}

package com.hida.cohida.account.domain;

import com.hida.cohida.account.enums.AccountRole;
import com.hida.cohida.admin.domain.Admin;
import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.customer.domain.Customer;
import jakarta.persistence.*;

import java.util.Locale;

@Entity
@Table(name = "accounts")
public class Account extends DomainEntity {
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", unique = true)
    private Customer customer;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", unique = true)
    private Admin admin;

    @Column(nullable = false, length = 254, unique = true)
    private String email;

    @Column(nullable = false, length = 60)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountRole role = AccountRole.CUSTOMER;

    protected Account() {
    }

    public Account(String email, String passwordHash) {
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public void assignTo(Customer customer) {
        this.customer = customer;
        this.admin = null;
    }

    public void assignTo(Admin admin) {
        this.admin = admin;
        this.customer = null;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void changeEmail(String email) {
        this.email = email;
    }

    public void normalize() {
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    public Customer getCustomer() {
        return customer;
    }

    public Admin getAdmin() {
        return admin;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public AccountRole getRole() {
        return role;
    }

    public void setRole(AccountRole role) {
        this.role = role;
    }
}

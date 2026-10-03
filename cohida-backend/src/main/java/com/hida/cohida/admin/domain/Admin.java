package com.hida.cohida.admin.domain;

import com.hida.cohida.account.domain.Account;
import com.hida.cohida.common.DomainEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "admins")
public class Admin extends DomainEntity {
    @Column(nullable = false, length = 120)
    private String name;

    @OneToOne(mappedBy = "admin", cascade = CascadeType.ALL, orphanRemoval = true, optional = false)
    private Account account;

    protected Admin() {
    }

    public Admin(String name) {
        this.name = name;
    }

    public void attachAccount(Account account) {
        account.assignTo(this);
        this.account = account;
    }

    public String getName() {
        return name;
    }

    public Account getAccount() {
        return account;
    }
}

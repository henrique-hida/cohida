package com.hida.cohida.notification.domain;

import com.hida.cohida.common.DomainEntity;
import com.hida.cohida.customer.domain.Customer;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Table(name = "notifications")
public class Notification extends DomainEntity {
    @Getter
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    @Getter
    @Column(nullable = false, length = 60)
    private String type;
    @Getter
    @Column(nullable = false, length = 240)
    private String message;
    @Getter
    @Column(name = "target_path", length = 240)
    private String targetPath;
    @Getter
    private boolean read;

    protected Notification() {
    }

    public Notification(Customer c, String t, String m, String p) {
        customer = c;
        type = t;
        message = m;
        targetPath = p;
    }

    public void markRead() {
        read = true;
    }
}

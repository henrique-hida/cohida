package com.hida.cohida.category.domain;

import com.hida.cohida.common.DomainEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

@Entity
@Table(name = "categories")
public class Category extends DomainEntity {
    @Getter @Column(nullable = false, unique = true, length = 80)
    private String slug;
    @Getter @Column(nullable = false, length = 100)
    private String name;
    @Getter @Column(nullable = false, length = 500)
    private String description;

    protected Category() { }

    public Category(String slug, String name, String description) {
        this.slug = slug;
        this.name = name;
        this.description = description;
    }

    public void update(String name, String description) {
        this.name = name;
        this.description = description;
    }
}

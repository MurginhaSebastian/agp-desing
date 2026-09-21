package com.agpdesing.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "admin_users")
public class AdminUserJpaEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 60, unique = true)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    protected AdminUserJpaEntity() {
        // JPA
    }

    public UUID getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
}

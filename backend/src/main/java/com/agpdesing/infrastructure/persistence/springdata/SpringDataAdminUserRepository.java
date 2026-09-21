package com.agpdesing.infrastructure.persistence.springdata;

import com.agpdesing.infrastructure.persistence.entity.AdminUserJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SpringDataAdminUserRepository extends JpaRepository<AdminUserJpaEntity, UUID> {
    Optional<AdminUserJpaEntity> findByUsername(String username);
}

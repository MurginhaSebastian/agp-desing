package com.agpdesing.domain.repository;

import com.agpdesing.domain.model.AdminUser;

import java.util.Optional;

public interface AdminUserRepository {
    Optional<AdminUser> findByUsername(String username);
}

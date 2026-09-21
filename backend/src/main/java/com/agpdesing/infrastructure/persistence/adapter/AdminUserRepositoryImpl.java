package com.agpdesing.infrastructure.persistence.adapter;

import com.agpdesing.domain.model.AdminUser;
import com.agpdesing.domain.repository.AdminUserRepository;
import com.agpdesing.infrastructure.persistence.springdata.SpringDataAdminUserRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@Transactional(readOnly = true)
public class AdminUserRepositoryImpl implements AdminUserRepository {

    private final SpringDataAdminUserRepository jpa;

    public AdminUserRepositoryImpl(SpringDataAdminUserRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Optional<AdminUser> findByUsername(String username) {
        return jpa.findByUsername(username).map(e -> new AdminUser(e.getUsername(), e.getPasswordHash()));
    }
}

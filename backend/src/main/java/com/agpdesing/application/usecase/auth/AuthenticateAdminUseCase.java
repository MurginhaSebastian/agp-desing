package com.agpdesing.application.usecase.auth;

import com.agpdesing.application.port.out.PasswordHasher;
import com.agpdesing.application.port.out.TokenProvider;
import com.agpdesing.domain.exception.InvalidCredentialsException;
import com.agpdesing.domain.model.AdminUser;
import com.agpdesing.domain.repository.AdminUserRepository;

public class AuthenticateAdminUseCase {

    /** Hash de relleno: se compara igual cuando el usuario no existe, para no filtrar por tiempo de respuesta. */
    private static final String DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEeO6z1n0V0cGkX4z1Xp1XzYQ0mQx1F8rXe";

    private final AdminUserRepository users;
    private final PasswordHasher hasher;
    private final TokenProvider tokens;

    public AuthenticateAdminUseCase(AdminUserRepository users, PasswordHasher hasher, TokenProvider tokens) {
        this.users = users;
        this.hasher = hasher;
        this.tokens = tokens;
    }

    public TokenProvider.IssuedToken execute(String username, String rawPassword) {
        AdminUser user = users.findByUsername(username).orElse(null);
        String hash = user == null ? DUMMY_HASH : user.passwordHash();
        boolean ok = hasher.matches(rawPassword, hash) && user != null;
        if (!ok) throw new InvalidCredentialsException();
        return tokens.issue(user.username());
    }
}

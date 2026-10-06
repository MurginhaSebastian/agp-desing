package com.agpdesing.application;

import com.agpdesing.application.port.out.PasswordHasher;
import com.agpdesing.application.port.out.TokenProvider;
import com.agpdesing.application.usecase.auth.AuthenticateAdminUseCase;
import com.agpdesing.domain.exception.InvalidCredentialsException;
import com.agpdesing.domain.model.AdminUser;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthenticateAdminUseCaseTest {

    private static final String HASH_REAL = "hash-de-admin";

    /** Apunta con qué hash se comparó cada vez: así se ve si el usuario inexistente también compara. */
    private final List<String> comparados = new ArrayList<>();
    private final PasswordHasher hasher = (raw, hash) -> {
        comparados.add(hash);
        return HASH_REAL.equals(hash) && "clave-buena".equals(raw);
    };
    private final TokenProvider tokens = new TokenProvider() {
        @Override public IssuedToken issue(String subject) { return new IssuedToken("token-" + subject, Instant.EPOCH); }
        @Override public Optional<String> validate(String token) { return Optional.empty(); }
    };
    private final AuthenticateAdminUseCase useCase = new AuthenticateAdminUseCase(
            username -> "admin".equals(username) ? Optional.of(new AdminUser("admin", HASH_REAL)) : Optional.empty(),
            hasher, tokens);

    @Test
    void goodCredentialsIssueATokenForTheUser() {
        assertEquals("token-admin", useCase.execute("admin", "clave-buena").value());
    }

    @Test
    void wrongPasswordIsInvalid() {
        assertThrows(InvalidCredentialsException.class, () -> useCase.execute("admin", "otra"));
    }

    @Test
    void unknownUserStillComparesAgainstADummyHash() {
        assertThrows(InvalidCredentialsException.class, () -> useCase.execute("nadie", "clave-buena"));
        assertEquals(1, comparados.size());
        assertTrue(comparados.get(0).startsWith("$2a$12$"));
    }

    @Test
    void nullPasswordIsInvalidWithoutComparing() {
        assertThrows(InvalidCredentialsException.class, () -> useCase.execute("admin", null));
        assertTrue(comparados.isEmpty());
    }

    @Test
    void passwordOver72BytesIsInvalidWithoutComparing() {
        String setentaYDos = "a".repeat(72);
        String setentaYTresBytes = "a".repeat(71) + "ñ"; // 71 + 2 bytes en UTF-8
        assertThrows(InvalidCredentialsException.class, () -> useCase.execute("admin", setentaYDos));
        assertEquals(1, comparados.size(), "72 bytes justos sí se comparan");
        assertThrows(InvalidCredentialsException.class, () -> useCase.execute("admin", setentaYTresBytes));
        assertEquals(1, comparados.size(), "73 bytes no llegan a compararse");
    }
}

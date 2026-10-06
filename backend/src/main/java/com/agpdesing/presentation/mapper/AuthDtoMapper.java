package com.agpdesing.presentation.mapper;

import com.agpdesing.application.port.out.TokenProvider;
import com.agpdesing.presentation.dto.response.AuthResponse;
import org.springframework.stereotype.Component;

/** Traduce núcleo -> JSON para /api/auth. */
@Component
public class AuthDtoMapper {

    public AuthResponse toResponse(TokenProvider.IssuedToken token, String username) {
        return new AuthResponse(token.value(), token.expiresAt(), username);
    }
}

package com.agpdesing.presentation.dto.response;

import java.time.Instant;

public record AuthResponse(String token, Instant expiresAt, String username) {}

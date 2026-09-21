package com.agpdesing.infrastructure.security.jwt;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Leído de app.jwt.* — que a su vez viene de JWT_SECRET y JWT_EXPIRATION_HOURS. */
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        /* HS256 exige >= 256 bits; 32 chars es el mínimo, se recomiendan 48+ en Base64 */
        @NotBlank @Size(min = 32) String secret,
        @Min(1) int expirationHours,
        @NotBlank String issuer
) {}

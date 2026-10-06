package com.agpdesing.infrastructure.security.jwt;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Activa `app.jwt.*` junto a quien la usa (antes estaba en UseCaseConfig, que no la necesita). */
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
class JwtConfig {
}

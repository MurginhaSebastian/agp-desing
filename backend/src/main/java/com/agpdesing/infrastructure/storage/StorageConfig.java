package com.agpdesing.infrastructure.storage;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Activa `app.storage.*` junto a quien la usa (antes estaba en UseCaseConfig, que no la necesita). */
@Configuration
@EnableConfigurationProperties(SupabaseStorageProperties.class)
class StorageConfig {
}

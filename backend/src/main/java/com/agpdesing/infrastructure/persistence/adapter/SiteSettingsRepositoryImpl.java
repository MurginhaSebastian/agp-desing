package com.agpdesing.infrastructure.persistence.adapter;

import com.agpdesing.domain.model.SiteSettings;
import com.agpdesing.domain.repository.SiteSettingsRepository;
import com.agpdesing.infrastructure.persistence.entity.SiteSettingJpaEntity;
import com.agpdesing.infrastructure.persistence.springdata.SpringDataSiteSettingRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;

/**
 * ADAPTADOR: traduce el objeto de ajustes a filas clave/valor.
 * Si falta la fila devuelve el valor vacío en vez de fallar: la portada
 * tiene que renderizar igual aunque la tabla esté a medias.
 */
@Component
@Transactional
public class SiteSettingsRepositoryImpl implements SiteSettingsRepository {

    static final String HERO_IMAGE_URL = "hero_image_url";

    private final SpringDataSiteSettingRepository jpa;
    private final Clock clock;

    public SiteSettingsRepositoryImpl(SpringDataSiteSettingRepository jpa, Clock clock) {
        this.jpa = jpa;
        this.clock = clock;
    }

    @Override
    @Transactional(readOnly = true)
    public SiteSettings load() {
        return new SiteSettings(jpa.findById(HERO_IMAGE_URL)
                .map(SiteSettingJpaEntity::getValue)
                .orElse(""));
    }

    @Override
    public SiteSettings save(SiteSettings settings) {
        Instant now = Instant.now(clock);
        SiteSettingJpaEntity row = jpa.findById(HERO_IMAGE_URL)
                .orElseGet(() -> new SiteSettingJpaEntity(HERO_IMAGE_URL, "", now));
        row.setValue(settings.heroImageUrl());
        row.setUpdatedAt(now);
        jpa.save(row);
        return settings;
    }
}

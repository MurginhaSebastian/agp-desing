package com.agpdesing.presentation.mapper;

import com.agpdesing.domain.model.SiteSettings;
import com.agpdesing.presentation.dto.response.SiteSettingsResponse;
import org.springframework.stereotype.Component;

/** Traduce núcleo -> JSON para /api/settings. */
@Component
public class SettingsDtoMapper {

    public SiteSettingsResponse toResponse(SiteSettings s) {
        return new SiteSettingsResponse(s.heroImageUrl());
    }
}

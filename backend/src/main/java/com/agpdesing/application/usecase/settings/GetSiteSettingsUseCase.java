package com.agpdesing.application.usecase.settings;

import com.agpdesing.domain.model.SiteSettings;
import com.agpdesing.domain.repository.SiteSettingsRepository;

public class GetSiteSettingsUseCase {

    private final SiteSettingsRepository settings;

    public GetSiteSettingsUseCase(SiteSettingsRepository settings) {
        this.settings = settings;
    }

    public SiteSettings execute() {
        return settings.load();
    }
}

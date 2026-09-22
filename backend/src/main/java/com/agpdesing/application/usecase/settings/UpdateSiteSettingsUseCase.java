package com.agpdesing.application.usecase.settings;

import com.agpdesing.domain.model.SiteSettings;
import com.agpdesing.domain.repository.SiteSettingsRepository;

public class UpdateSiteSettingsUseCase {

    private final SiteSettingsRepository settings;

    public UpdateSiteSettingsUseCase(SiteSettingsRepository settings) {
        this.settings = settings;
    }

    /** El constructor de SiteSettings valida; si la URL no sirve, no se llega a guardar. */
    public SiteSettings execute(String heroImageUrl) {
        return settings.save(new SiteSettings(heroImageUrl));
    }
}

package com.agpdesing.application;

import com.agpdesing.application.usecase.settings.GetSiteSettingsUseCase;
import com.agpdesing.application.usecase.settings.UpdateSiteSettingsUseCase;
import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.model.SiteSettings;
import com.agpdesing.domain.repository.SiteSettingsRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Igual que los demás casos de uso: sin Spring y sin base de datos. */
class SiteSettingsUseCasesTest {

    private final InMemorySettings repo = new InMemorySettings();
    private final GetSiteSettingsUseCase get = new GetSiteSettingsUseCase(repo);
    private final UpdateSiteSettingsUseCase update = new UpdateSiteSettingsUseCase(repo);

    @Test
    void startsWithoutHeroImage() {
        assertFalse(get.execute().hasHeroImage());
    }

    @Test
    void savesAndTrimsUrl() {
        SiteSettings saved = update.execute("  https://cdn.example.com/portada.jpg  ");

        assertEquals("https://cdn.example.com/portada.jpg", saved.heroImageUrl());
        assertTrue(get.execute().hasHeroImage());
    }

    @Test
    void emptyValueClearsTheImage() {
        update.execute("/images/portada.jpg");
        update.execute("");

        assertFalse(get.execute().hasHeroImage());
    }

    @Test
    void rejectsUrlThatIsNotHttpOrAbsolutePath() {
        assertThrows(DomainValidationException.class, () -> update.execute("javascript:alert(1)"));
    }

    static final class InMemorySettings implements SiteSettingsRepository {
        private SiteSettings current = SiteSettings.empty();

        @Override public SiteSettings load() { return current; }
        @Override public SiteSettings save(SiteSettings settings) { current = settings; return settings; }
    }
}

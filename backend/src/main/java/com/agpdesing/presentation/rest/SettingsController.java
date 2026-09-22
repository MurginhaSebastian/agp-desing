package com.agpdesing.presentation.rest;

import com.agpdesing.application.usecase.settings.GetSiteSettingsUseCase;
import com.agpdesing.application.usecase.settings.UpdateSiteSettingsUseCase;
import com.agpdesing.domain.model.SiteSettings;
import com.agpdesing.presentation.dto.request.SiteSettingsRequest;
import com.agpdesing.presentation.dto.response.SiteSettingsResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET es público: la portada lo llama en cada carga.
 * PUT exige ROLE_ADMIN — la regla vive en SecurityConfig, no aquí.
 */
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final GetSiteSettingsUseCase get;
    private final UpdateSiteSettingsUseCase update;

    public SettingsController(GetSiteSettingsUseCase get, UpdateSiteSettingsUseCase update) {
        this.get = get;
        this.update = update;
    }

    @GetMapping
    public SiteSettingsResponse current() {
        return toResponse(get.execute());
    }

    @PutMapping
    public SiteSettingsResponse replace(@Valid @RequestBody SiteSettingsRequest body) {
        return toResponse(update.execute(body.heroImageUrl()));
    }

    private SiteSettingsResponse toResponse(SiteSettings s) {
        return new SiteSettingsResponse(s.heroImageUrl());
    }
}

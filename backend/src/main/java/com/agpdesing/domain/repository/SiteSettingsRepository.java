package com.agpdesing.domain.repository;

import com.agpdesing.domain.model.SiteSettings;

/**
 * PUERTO de persistencia de los ajustes. El dominio no sabe que por debajo hay
 * una tabla clave/valor: pide y entrega el objeto completo.
 */
public interface SiteSettingsRepository {
    SiteSettings load();
    SiteSettings save(SiteSettings settings);
}

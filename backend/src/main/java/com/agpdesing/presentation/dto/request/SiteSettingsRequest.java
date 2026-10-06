package com.agpdesing.presentation.dto.request;

import com.agpdesing.domain.model.SiteSettings;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Cuerpo de PUT /api/settings. La cadena vacía es válida y significa "sin imagen":
 * la portada vuelve a ser solo tipográfica.
 */
public record SiteSettingsRequest(
        @Size(max = SiteSettings.URL_MAX)
        @Pattern(regexp = "^$|^(https?://|/).+", message = "Debe ser una URL http(s), una ruta que empiece por / o quedar vacío")
        String heroImageUrl
) {
}

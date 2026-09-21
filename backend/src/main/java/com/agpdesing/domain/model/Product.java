package com.agpdesing.domain.model;

import com.agpdesing.domain.exception.DomainValidationException;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;

/**
 * Entidad de dominio. Sin anotaciones de JPA ni Spring: las invariantes viven aquí
 * y se cumplen sin importar desde dónde se construya el objeto.
 */
public final class Product {

    public static final int NAME_MAX = 120;
    public static final int DESCRIPTION_MAX = 2000;
    public static final int TECHNIQUE_MAX = 80;
    public static final int IMAGE_URL_MAX = 500;

    private final ProductId id;
    private String name;
    private String slug;
    private String description;
    private Money price;
    private int widthCm;
    private int heightCm;
    private String technique;
    private String imageUrl;
    private ProductStatus status;
    private boolean featured;
    private final Instant createdAt;
    private Instant updatedAt;

    private Product(ProductId id, String name, String description, Money price, int widthCm, int heightCm,
                    String technique, String imageUrl, ProductStatus status, boolean featured,
                    Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id);
        this.createdAt = Objects.requireNonNull(createdAt);
        this.updatedAt = Objects.requireNonNull(updatedAt);
        applyName(name);
        applyDescription(description);
        this.price = Objects.requireNonNull(price);
        applyDimensions(widthCm, heightCm);
        applyTechnique(technique);
        applyImageUrl(imageUrl);
        this.status = Objects.requireNonNull(status);
        this.featured = featured;
    }

    /** Caso de uso "crear": genera id, slug y timestamps. */
    public static Product create(String name, String description, Money price, int widthCm, int heightCm,
                                 String technique, String imageUrl, ProductStatus status, boolean featured,
                                 Instant now) {
        return new Product(ProductId.newId(), name, description, price, widthCm, heightCm,
                technique, imageUrl, status, featured, now, now);
    }

    /** Reconstrucción desde persistencia: no vuelve a generar nada. */
    public static Product rehydrate(ProductId id, String name, String slug, String description, Money price,
                                    int widthCm, int heightCm, String technique, String imageUrl,
                                    ProductStatus status, boolean featured, Instant createdAt, Instant updatedAt) {
        Product p = new Product(id, name, description, price, widthCm, heightCm, technique, imageUrl,
                status, featured, createdAt, updatedAt);
        p.slug = Objects.requireNonNull(slug);
        return p;
    }

    public void update(String name, String description, Money price, int widthCm, int heightCm,
                       String technique, String imageUrl, ProductStatus status, boolean featured, Instant now) {
        applyName(name);
        applyDescription(description);
        this.price = Objects.requireNonNull(price);
        applyDimensions(widthCm, heightCm);
        applyTechnique(technique);
        applyImageUrl(imageUrl);
        this.status = Objects.requireNonNull(status);
        this.featured = featured;
        this.updatedAt = Objects.requireNonNull(now);
    }

    // --- invariantes ---

    private void applyName(String value) {
        String v = value == null ? "" : value.strip();
        if (v.length() < 2) throw new DomainValidationException("name", "El nombre necesita al menos 2 caracteres");
        if (v.length() > NAME_MAX) throw new DomainValidationException("name", "Máximo " + NAME_MAX + " caracteres");
        this.name = v;
        this.slug = slugify(v);
    }

    private void applyDescription(String value) {
        String v = value == null ? "" : value.strip();
        if (v.length() > DESCRIPTION_MAX) throw new DomainValidationException("description", "Máximo " + DESCRIPTION_MAX + " caracteres");
        this.description = v;
    }

    private void applyDimensions(int width, int height) {
        if (width <= 0) throw new DomainValidationException("widthCm", "El ancho debe ser mayor que cero");
        if (height <= 0) throw new DomainValidationException("heightCm", "El alto debe ser mayor que cero");
        this.widthCm = width;
        this.heightCm = height;
    }

    private void applyTechnique(String value) {
        String v = value == null ? "" : value.strip();
        if (v.isEmpty()) throw new DomainValidationException("technique", "La técnica es obligatoria");
        if (v.length() > TECHNIQUE_MAX) throw new DomainValidationException("technique", "Máximo " + TECHNIQUE_MAX + " caracteres");
        this.technique = v;
    }

    private void applyImageUrl(String value) {
        String v = value == null ? "" : value.strip();
        boolean ok = v.startsWith("https://") || v.startsWith("http://") || v.startsWith("/");
        if (!ok) throw new DomainValidationException("imageUrl", "Debe ser una URL http(s) o una ruta que empiece por /");
        if (v.length() > IMAGE_URL_MAX) throw new DomainValidationException("imageUrl", "Máximo " + IMAGE_URL_MAX + " caracteres");
        this.imageUrl = v;
    }

    static String slugify(String input) {
        String ascii = Normalizer.normalize(input, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = ascii.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");
        return slug.isEmpty() ? "obra" : slug;
    }

    // --- getters ---
    public ProductId id() { return id; }
    public String name() { return name; }
    public String slug() { return slug; }
    public String description() { return description; }
    public Money price() { return price; }
    public int widthCm() { return widthCm; }
    public int heightCm() { return heightCm; }
    public String technique() { return technique; }
    public String imageUrl() { return imageUrl; }
    public ProductStatus status() { return status; }
    public boolean featured() { return featured; }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
}

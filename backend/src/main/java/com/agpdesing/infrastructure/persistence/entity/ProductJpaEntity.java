package com.agpdesing.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Tabla "products". Es una clase distinta de domain.model.Product a propósito:
 * el dominio no sabe que existe JPA, y cambiar de base de datos solo toca este paquete.
 */
@Entity
@Table(name = "products")
public class ProductJpaEntity {

    @Id
    @Column(nullable = false)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 140, unique = true)
    private String slug;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "price_cents", nullable = false)
    private long priceCents;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "width_cm", nullable = false)
    private int widthCm;

    @Column(name = "height_cm", nullable = false)
    private int heightCm;

    @Column(nullable = false, length = 80)
    private String technique;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false)
    private boolean featured;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ProductJpaEntity() {
        // JPA
    }

    public ProductJpaEntity(UUID id, String name, String slug, String description, long priceCents, String currency,
                            int widthCm, int heightCm, String technique, String imageUrl, String status,
                            boolean featured, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.priceCents = priceCents;
        this.currency = currency;
        this.widthCm = widthCm;
        this.heightCm = heightCm;
        this.technique = technique;
        this.imageUrl = imageUrl;
        this.status = status;
        this.featured = featured;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getDescription() { return description; }
    public long getPriceCents() { return priceCents; }
    public String getCurrency() { return currency; }
    public int getWidthCm() { return widthCm; }
    public int getHeightCm() { return heightCm; }
    public String getTechnique() { return technique; }
    public String getImageUrl() { return imageUrl; }
    public String getStatus() { return status; }
    public boolean isFeatured() { return featured; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

package com.agpdesing.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/** Una fila por ajuste. La tabla es clave/valor; el dominio ve un objeto con campos. */
@Entity
@Table(name = "site_settings")
public class SiteSettingJpaEntity {

    @Id
    @Column(name = "setting_key", nullable = false, length = 60)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 500)
    private String value;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SiteSettingJpaEntity() {
    }

    public SiteSettingJpaEntity(String key, String value, Instant updatedAt) {
        this.key = key;
        this.value = value;
        this.updatedAt = updatedAt;
    }

    public String getKey() { return key; }
    public String getValue() { return value; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setValue(String value) { this.value = value; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

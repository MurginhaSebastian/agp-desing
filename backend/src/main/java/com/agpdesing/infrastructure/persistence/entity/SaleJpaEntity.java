package com.agpdesing.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Tabla "sales". Distinta de domain.model.Sale a propósito, como ProductJpaEntity. */
@Entity
@Table(name = "sales")
public class SaleJpaEntity {

    @Id
    @Column(nullable = false)
    private UUID id;

    @Column(name = "product_id")
    private UUID productId;

    @Column(nullable = false, length = 120)
    private String item;

    @Column(nullable = false, length = 2000)
    private String detail;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "total_cents", nullable = false)
    private long totalCents;

    @Column(name = "advance_cents", nullable = false)
    private long advanceCents;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "customer_name", nullable = false, length = 80)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 15)
    private String customerPhone;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SaleJpaEntity() {
        // JPA
    }

    public SaleJpaEntity(UUID id, UUID productId, String item, String detail, int quantity, long totalCents,
                         long advanceCents, String paymentMethod, String status, String customerName,
                         String customerPhone, LocalDate saleDate, LocalDate deliveryDate, Instant createdAt,
                         Instant updatedAt) {
        this.id = id;
        this.productId = productId;
        this.item = item;
        this.detail = detail;
        this.quantity = quantity;
        this.totalCents = totalCents;
        this.advanceCents = advanceCents;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.saleDate = saleDate;
        this.deliveryDate = deliveryDate;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public UUID getProductId() { return productId; }
    public String getItem() { return item; }
    public String getDetail() { return detail; }
    public int getQuantity() { return quantity; }
    public long getTotalCents() { return totalCents; }
    public long getAdvanceCents() { return advanceCents; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getStatus() { return status; }
    public String getCustomerName() { return customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public LocalDate getSaleDate() { return saleDate; }
    public LocalDate getDeliveryDate() { return deliveryDate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

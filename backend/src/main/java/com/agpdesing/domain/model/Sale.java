package com.agpdesing.domain.model;

import com.agpdesing.domain.exception.DomainValidationException;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;

/**
 * Una venta cerrada por WhatsApp y apuntada a mano en el panel. Solo existe para el taller: nada
 * de esto llega nunca a la web pública.
 *
 * Puede ser de una obra del catálogo (`productId`) o un encargo a medida (sin obra). En los dos
 * casos `item` dice qué se vendió: con obra, se copia su nombre al vender, para que la venta siga
 * diciendo lo mismo aunque la obra cambie de nombre o se borre.
 *
 * Siempre en soles. El saldo (lo que falta cobrar) se calcula: total menos adelanto.
 */
public final class Sale {

    public static final int ITEM_MAX = 120;
    public static final int DETAIL_MAX = 2000;
    public static final int QUANTITY_MAX = 99;
    public static final int CUSTOMER_NAME_MAX = 80;
    public static final int PHONE_MIN_DIGITS = 9;
    public static final int PHONE_MAX_DIGITS = 15;

    private final SaleId id;
    private ProductId productId;
    private String item;
    private String detail;
    private int quantity;
    private long totalCents;
    private long advanceCents;
    private PaymentMethod paymentMethod;
    private SaleStatus status;
    private String customerName;
    private String customerPhone;
    private LocalDate saleDate;
    private LocalDate deliveryDate;
    private final Instant createdAt;
    private Instant updatedAt;

    /** Los datos que se escriben en el formulario; el resto (id, fechas de registro) los pone la venta. */
    public record Datos(ProductId productId, String item, String detail, int quantity, long totalCents,
                        long advanceCents, PaymentMethod paymentMethod, SaleStatus status, String customerName,
                        String customerPhone, LocalDate saleDate, LocalDate deliveryDate) {}

    private Sale(SaleId id, Datos d, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id);
        this.createdAt = Objects.requireNonNull(createdAt);
        this.updatedAt = Objects.requireNonNull(updatedAt);
        apply(d);
    }

    public static Sale create(Datos d, Instant now) {
        return new Sale(SaleId.newId(), d, now, now);
    }

    /** Reconstrucción desde la base de datos. */
    public static Sale rehydrate(SaleId id, Datos d, Instant createdAt, Instant updatedAt) {
        return new Sale(id, d, createdAt, updatedAt);
    }

    public void update(Datos d, Instant now) {
        apply(d);
        this.updatedAt = Objects.requireNonNull(now);
    }

    /** Lo que falta cobrar. */
    public long balanceCents() {
        return totalCents - advanceCents;
    }

    public boolean cancelled() {
        return status == SaleStatus.CANCELLED;
    }

    // --- invariantes ---

    private void apply(Datos d) {
        this.productId = d.productId();
        this.item = texto("item", d.item(), 2, ITEM_MAX, "Escribe qué se vendió");
        this.detail = d.detail() == null ? "" : d.detail().strip();
        if (detail.length() > DETAIL_MAX) throw new DomainValidationException("detail", "Máximo " + DETAIL_MAX + " caracteres");
        if (d.quantity() < 1 || d.quantity() > QUANTITY_MAX) {
            throw new DomainValidationException("quantity", "La cantidad va de 1 a " + QUANTITY_MAX);
        }
        this.quantity = d.quantity();
        if (d.totalCents() <= 0) throw new DomainValidationException("totalCents", "El total debe ser mayor que cero");
        if (d.advanceCents() < 0) throw new DomainValidationException("advanceCents", "El adelanto no puede ser negativo");
        if (d.advanceCents() > d.totalCents()) {
            throw new DomainValidationException("advanceCents", "El adelanto no puede ser mayor que el total");
        }
        this.totalCents = d.totalCents();
        this.advanceCents = d.advanceCents();
        this.paymentMethod = obligatorio("paymentMethod", d.paymentMethod(), "Elige cómo pagó");
        this.status = obligatorio("status", d.status(), "Elige el estado de la venta");
        this.customerName = texto("customerName", d.customerName(), 2, CUSTOMER_NAME_MAX, "Escribe el nombre del cliente");
        this.customerPhone = telefono(d.customerPhone());
        this.saleDate = obligatorio("saleDate", d.saleDate(), "Indica la fecha de la venta");
        if (d.deliveryDate() != null && d.deliveryDate().isBefore(d.saleDate())) {
            throw new DomainValidationException("deliveryDate", "La entrega no puede ser antes de la venta");
        }
        this.deliveryDate = d.deliveryDate();
    }

    private static String texto(String campo, String valor, int min, int max, String siFalta) {
        String v = valor == null ? "" : valor.strip();
        if (v.length() < min) throw new DomainValidationException(campo, siFalta);
        if (v.length() > max) throw new DomainValidationException(campo, "Máximo " + max + " caracteres");
        return v;
    }

    private static <T> T obligatorio(String campo, T valor, String siFalta) {
        if (valor == null) throw new DomainValidationException(campo, siFalta);
        return valor;
    }

    /** Se guardan solo los dígitos: «+51 987 654 321» y «987654321» son el mismo número escrito distinto. */
    private static String telefono(String valor) {
        String digitos = valor == null ? "" : valor.replaceAll("\\D", "");
        if (digitos.length() < PHONE_MIN_DIGITS || digitos.length() > PHONE_MAX_DIGITS) {
            throw new DomainValidationException("customerPhone", "Escribe un teléfono de " + PHONE_MIN_DIGITS + " a " + PHONE_MAX_DIGITS + " dígitos");
        }
        return digitos;
    }

    // --- getters ---
    public SaleId id() { return id; }
    public Optional<ProductId> productId() { return Optional.ofNullable(productId); }
    public String item() { return item; }
    public String detail() { return detail; }
    public int quantity() { return quantity; }
    public long totalCents() { return totalCents; }
    public long advanceCents() { return advanceCents; }
    public PaymentMethod paymentMethod() { return paymentMethod; }
    public SaleStatus status() { return status; }
    public String customerName() { return customerName; }
    public String customerPhone() { return customerPhone; }
    public LocalDate saleDate() { return saleDate; }
    public Optional<LocalDate> deliveryDate() { return Optional.ofNullable(deliveryDate); }
    public Instant createdAt() { return createdAt; }
    public Instant updatedAt() { return updatedAt; }
}

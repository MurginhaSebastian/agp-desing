package com.agpdesing.application.usecase.sale;

import com.agpdesing.application.port.out.Transacciones;
import com.agpdesing.domain.exception.ProductNotFoundException;
import com.agpdesing.domain.exception.SaleNotFoundException;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleId;
import com.agpdesing.domain.repository.ProductRepository;
import com.agpdesing.domain.repository.SaleRepository;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

/**
 * Registrar una venta nueva o editar una que ya existe.
 *
 * Si es de una obra del catálogo: la obra tiene que existir, la venta copia su nombre al
 * registrarse (y lo conserva aunque la obra cambie de nombre o se borre) y, si se pide, la obra
 * pasa a «Vendido». Todo va en UNA transacción: o se guardan la venta y la obra, o ninguna. La
 * venta se valida antes de tocar la obra.
 */
public class SaveSaleUseCase {

    private final SaleRepository sales;
    private final ProductRepository products;
    private final Clock clock;
    private final Transacciones transacciones;

    public SaveSaleUseCase(SaleRepository sales, ProductRepository products, Clock clock, Transacciones transacciones) {
        this.sales = sales;
        this.products = products;
        this.clock = clock;
        this.transacciones = transacciones;
    }

    public Sale create(SaleCommand cmd) {
        return transacciones.enTransaccion(() -> {
            Instant now = Instant.now(clock);
            Optional<Product> product = obra(cmd);
            Sale sale = Sale.create(datos(cmd, product.map(Product::name).orElse(cmd.item())), now);
            product.ifPresent((p) -> marcarSiSePide(cmd, p, now));
            return sales.save(sale);
        });
    }

    public Sale update(SaleId id, SaleCommand cmd) {
        return transacciones.enTransaccion(() -> {
            Sale sale = sales.findById(id).orElseThrow(() -> new SaleNotFoundException(id.value().toString()));
            Instant now = Instant.now(clock);
            Optional<Product> product = obra(cmd);
            // Misma obra que ya tenía: se conserva el nombre con el que se vendió.
            boolean mismaObra = product.isPresent() && sale.productId().equals(product.map(Product::id));
            String item = product.map((p) -> mismaObra ? sale.item() : p.name()).orElse(cmd.item());
            sale.update(datos(cmd, item), now);
            product.ifPresent((p) -> marcarSiSePide(cmd, p, now));
            return sales.save(sale);
        });
    }

    private Optional<Product> obra(SaleCommand cmd) {
        if (cmd.productId() == null) return Optional.empty();
        return Optional.of(products.findById(cmd.productId())
                .orElseThrow(() -> new ProductNotFoundException(cmd.productId().value().toString())));
    }

    private void marcarSiSePide(SaleCommand cmd, Product product, Instant now) {
        if (!cmd.markProductSold() || product.status() == ProductStatus.SOLD) return;
        product.changeStatus(ProductStatus.SOLD, now);
        products.save(product);
    }

    private static Sale.Datos datos(SaleCommand cmd, String item) {
        return new Sale.Datos(cmd.productId(), item, cmd.detail(), cmd.quantity(), cmd.totalCents(),
                cmd.advanceCents(), cmd.paymentMethod(), cmd.status(), cmd.customerName(), cmd.customerPhone(),
                cmd.saleDate(), cmd.deliveryDate());
    }
}

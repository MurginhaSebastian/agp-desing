package com.agpdesing.application.usecase.sale;

import com.agpdesing.application.port.out.Transacciones;
import com.agpdesing.domain.exception.SaleNotFoundException;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleId;
import com.agpdesing.domain.repository.SaleRepository;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

/** Leer y borrar ventas. */
public class QuerySalesUseCase {

    private final SaleRepository sales;
    private final Transacciones transacciones;

    public QuerySalesUseCase(SaleRepository sales, Transacciones transacciones) {
        this.sales = sales;
        this.transacciones = transacciones;
    }

    public Sale byId(SaleId id) {
        return sales.findById(id).orElseThrow(() -> new SaleNotFoundException(id.value().toString()));
    }

    /** Las más recientes primero; a igual fecha, la última registrada primero. */
    public List<Sale> between(LocalDate desde, LocalDate hasta) {
        return sales.findBetween(desde, hasta).stream()
                .sorted(Comparator.comparing(Sale::saleDate).thenComparing(Sale::createdAt).reversed())
                .toList();
    }

    public void delete(SaleId id) {
        transacciones.enTransaccion(() -> {
            if (sales.findById(id).isEmpty()) throw new SaleNotFoundException(id.value().toString());
            sales.deleteById(id);
        });
    }
}

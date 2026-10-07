package com.agpdesing.domain.repository;

import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleId;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** PUERTO de persistencia de las ventas. */
public interface SaleRepository {
    Sale save(Sale sale);
    Optional<Sale> findById(SaleId id);
    /** Ventas con fecha de venta entre `desde` y `hasta`, ambos incluidos. */
    List<Sale> findBetween(LocalDate desde, LocalDate hasta);
    void deleteById(SaleId id);
}

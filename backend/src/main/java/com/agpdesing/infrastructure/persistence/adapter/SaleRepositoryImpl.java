package com.agpdesing.infrastructure.persistence.adapter;

import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleId;
import com.agpdesing.domain.repository.SaleRepository;
import com.agpdesing.infrastructure.persistence.mapper.SalePersistenceMapper;
import com.agpdesing.infrastructure.persistence.springdata.SpringDataSaleRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** ADAPTADOR: cumple el puerto de ventas con Spring Data JPA. */
@Component
@Transactional
public class SaleRepositoryImpl implements SaleRepository {

    private final SpringDataSaleRepository jpa;
    private final SalePersistenceMapper mapper;

    public SaleRepositoryImpl(SpringDataSaleRepository jpa, SalePersistenceMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    public Sale save(Sale sale) {
        return mapper.toDomain(jpa.save(mapper.toEntity(sale)));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Sale> findById(SaleId id) {
        return jpa.findById(id.value()).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Sale> findBetween(LocalDate desde, LocalDate hasta) {
        return jpa.findBySaleDateBetween(desde, hasta).stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(SaleId id) {
        jpa.deleteById(id.value());
    }
}

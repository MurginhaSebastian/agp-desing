package com.agpdesing.infrastructure.persistence.springdata;

import com.agpdesing.infrastructure.persistence.entity.SaleJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Consultas derivadas (parametrizadas); nunca SQL concatenado. */
public interface SpringDataSaleRepository extends JpaRepository<SaleJpaEntity, UUID> {
    List<SaleJpaEntity> findBySaleDateBetween(LocalDate desde, LocalDate hasta);
}

package com.agpdesing.presentation.rest;

import com.agpdesing.application.usecase.sale.QuerySalesUseCase;
import com.agpdesing.application.usecase.sale.SalesSummaryUseCase;
import com.agpdesing.application.usecase.sale.SaveSaleUseCase;
import com.agpdesing.domain.exception.DomainValidationException;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleId;
import com.agpdesing.presentation.csv.VentasCsv;
import com.agpdesing.presentation.dto.request.SaleRequest;
import com.agpdesing.presentation.dto.response.SaleResponse;
import com.agpdesing.presentation.dto.response.SalesSummaryResponse;
import com.agpdesing.presentation.mapper.SaleDtoMapper;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Ventas del taller. TODO exige ROLE_ADMIN, también leer: son nombres, teléfonos y cuentas de
 * clientes, y no hay nada aquí que deba ver nadie más. La regla vive en SecurityConfig.
 */
@RestController
@RequestMapping("/api/sales")
public class SaleController {

    /** El taller está en Perú: «hoy» y «este mes» son los de Lima, no los del servidor. */
    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    /** Más de dos años de ventas en una lista o un archivo es casi seguro un error al elegir fechas. */
    private static final int MAX_DIAS = 731;

    private final SaveSaleUseCase save;
    private final QuerySalesUseCase query;
    private final SalesSummaryUseCase summary;
    private final SaleDtoMapper mapper;
    private final Clock clock;

    public SaleController(SaveSaleUseCase save, QuerySalesUseCase query, SalesSummaryUseCase summary,
                          SaleDtoMapper mapper, Clock clock) {
        this.save = save;
        this.query = query;
        this.summary = summary;
        this.mapper = mapper;
        this.clock = clock;
    }

    /** Sin fechas: el mes en curso. */
    @GetMapping
    public List<SaleResponse> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ventas(desde, hasta).stream().map(mapper::toResponse).toList();
    }

    @GetMapping("/{id}")
    public SaleResponse byId(@PathVariable UUID id) {
        return mapper.toResponse(query.byId(new SaleId(id)));
    }

    @PostMapping
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest body) {
        Sale created = save.create(mapper.toCommand(body));
        return ResponseEntity.created(URI.create("/api/sales/" + created.id().value())).body(mapper.toResponse(created));
    }

    @PutMapping("/{id}")
    public SaleResponse update(@PathVariable UUID id, @Valid @RequestBody SaleRequest body) {
        return mapper.toResponse(save.update(new SaleId(id), mapper.toCommand(body)));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        query.delete(new SaleId(id));
    }

    /** `?mes=2026-10`; sin él, el mes en curso. */
    @GetMapping("/resumen")
    public SalesSummaryResponse resumen(@RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth mes) {
        return mapper.toResponse(summary.of(mes != null ? mes : YearMonth.now(clock.withZone(LIMA))));
    }

    @GetMapping("/export.csv")
    public ResponseEntity<byte[]> export(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
                                         @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        LocalDate[] rango = rango(desde, hasta);
        String nombre = "ventas-" + rango[0] + "-a-" + rango[1] + ".csv";
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(nombre).build().toString())
                .body(VentasCsv.escribir(query.between(rango[0], rango[1])));
    }

    private List<Sale> ventas(LocalDate desde, LocalDate hasta) {
        LocalDate[] rango = rango(desde, hasta);
        return query.between(rango[0], rango[1]);
    }

    private LocalDate[] rango(LocalDate desde, LocalDate hasta) {
        YearMonth mes = YearMonth.now(clock.withZone(LIMA));
        LocalDate d = desde != null ? desde : mes.atDay(1);
        LocalDate h = hasta != null ? hasta : mes.atEndOfMonth();
        if (h.isBefore(d)) throw new DomainValidationException("hasta", "La fecha final no puede ser antes de la inicial");
        if (d.plusDays(MAX_DIAS).isBefore(h)) throw new DomainValidationException("hasta", "Elige un periodo de dos años como mucho");
        return new LocalDate[] {d, h};
    }
}

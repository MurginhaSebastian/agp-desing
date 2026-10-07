package com.agpdesing.presentation.csv;

import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleStatus;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VentasCsvTest {

    private static Sale venta(String cliente, String detalle) {
        return Sale.create(new Sale.Datos(null, "Box aniversario", detalle, 2, 15_050, 5_000, PaymentMethod.CASH_ON_DELIVERY,
                SaleStatus.IN_PRODUCTION, cliente, "51987654321", LocalDate.of(2026, 10, 7), null), Instant.EPOCH);
    }

    @Test
    void cabeceraBomYUnaFilaComoLaEspera_ExcelEnPeru() {
        String csv = new String(VentasCsv.escribir(List.of(venta("Ana Torres", "Fotos; nombres"))), StandardCharsets.UTF_8);
        assertTrue(csv.startsWith("﻿Fecha;Cliente;Teléfono;"), "BOM y separador ;");
        String[] lineas = csv.split("\r\n");
        assertEquals(2, lineas.length);
        assertEquals("2026-10-07;Ana Torres;51 987 654 321;Box aniversario;\"Fotos; nombres\";2;150.50;50.00;100.50;"
                + "Contraentrega;En producción;", lineas[1]);
    }

    @Test
    void lasFormulasNoSeEjecutan() {
        assertEquals("'=HYPERLINK(\"x\")", VentasCsv.celda("=HYPERLINK(\"x\")").replace("\"\"", "\"").replaceAll("^\"|\"$", ""));
        assertEquals("'+51", VentasCsv.celda("+51"));
        assertEquals("'-1", VentasCsv.celda("-1"));
        assertEquals("'@SUM(A1)", VentasCsv.celda("@SUM(A1)"));
        assertEquals("Ana", VentasCsv.celda("Ana"));
    }

    @Test
    void comillasYSaltosDeLineaVanEntrecomillados() {
        assertEquals("\"dijo \"\"hola\"\"\"", VentasCsv.celda("dijo \"hola\""));
        assertEquals("\"línea 1\nlínea 2\"", VentasCsv.celda("línea 1\nlínea 2"));
    }

    @Test
    void solesConPuntoYDosDecimales() {
        assertEquals("95.00", VentasCsv.soles(9_500));
        assertEquals("0.05", VentasCsv.soles(5));
        assertEquals("1200.50", VentasCsv.soles(120_050));
    }

    @Test
    void telefonoAgrupadoParaQueExcelNoLoConviertaEnNumero() {
        assertEquals("987 654 321", VentasCsv.telefono("987654321"));
        assertEquals("51 987 654 321", VentasCsv.telefono("51987654321"));
    }
}

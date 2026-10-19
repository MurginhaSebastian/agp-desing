package com.agpdesing.presentation.csv;

import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleStatus;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

    @Test
    void sinVentasSoloQuedanElBomYLaCabecera() {
        String csv = new String(VentasCsv.escribir(List.of()), StandardCharsets.UTF_8);
        assertEquals("﻿Fecha;Cliente;Teléfono;Qué se vendió;Detalle;Cantidad;Total (S/);Adelanto (S/);Saldo (S/);"
                + "Pago;Estado;Entrega\r\n", csv);
    }

    @Test
    void empiezaPorLosTresBytesDelBomUtf8YGuardaLasTildesEnUtf8() {
        byte[] bytes = VentasCsv.escribir(List.of(venta("Peña Núñez", "Marco dorado")));
        assertArrayEquals(new byte[] { (byte) 0xEF, (byte) 0xBB, (byte) 0xBF }, Arrays.copyOf(bytes, 3));
        String texto = new String(bytes, StandardCharsets.UTF_8);
        assertTrue(texto.contains("Peña Núñez"));
        assertTrue(texto.contains("Teléfono"));
        assertFalse(texto.contains("�"), "ningún carácter roto");
    }

    @Test
    void laFechaDeEntregaSaleEnLaUltimaColumnaSiExiste() {
        Sale conEntrega = Sale.create(new Sale.Datos(null, "Box aniversario", "", 1, 9_500, 0, PaymentMethod.YAPE,
                SaleStatus.DELIVERED, "Ana Torres", "987654321", LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)), Instant.EPOCH);
        String fila = new String(VentasCsv.escribir(List.of(conEntrega)), StandardCharsets.UTF_8).split("\r\n")[1];
        assertTrue(fila.endsWith(";Entregada;2026-10-20"), fila);
    }

    @Test
    void todoMedioDePagoYTodoEstadoTienenEtiquetaEnEspanol() {
        // Si se añade un valor al enum y se olvida su etiqueta, la celda saldría vacía sin avisar.
        for (PaymentMethod pago : PaymentMethod.values()) {
            for (SaleStatus estado : SaleStatus.values()) {
                Sale v = Sale.create(new Sale.Datos(null, "Box aniversario", "", 1, 9_500, 0, pago, estado,
                        "Ana Torres", "987654321", LocalDate.of(2026, 10, 7), null), Instant.EPOCH);
                String[] celdas = new String(VentasCsv.escribir(List.of(v)), StandardCharsets.UTF_8)
                        .split("\r\n")[1].split(";", -1);
                assertFalse(celdas[9].isBlank(), "pago " + pago);
                assertFalse(celdas[10].isBlank(), "estado " + estado);
            }
        }
    }

    @Test
    void unDetalleConSaltoDeLineaYPuntoYComaVaEntrecomilladoEnUnaSolaCelda() {
        String csv = new String(VentasCsv.escribir(List.of(venta("Ana", "línea 1\nlínea 2; con punto y coma"))), StandardCharsets.UTF_8);
        assertTrue(csv.contains("\"línea 1\nlínea 2; con punto y coma\""), csv);
        assertTrue(csv.endsWith("\r\n"));
    }

    @Test
    void celdasNulasOVaciasSonVacias() {
        assertEquals("", VentasCsv.celda(null));
        assertEquals("", VentasCsv.celda(""));
    }

    @Test
    void laFormulaYElEntrecomilladoSeCombinan() {
        assertEquals("\"'=A1;B1\"", VentasCsv.celda("=A1;B1"));
        assertEquals("'\tcmd", VentasCsv.celda("\tcmd"));
        assertEquals("'-", VentasCsv.celda("-"));
        assertEquals("\"'\rx\"", VentasCsv.celda("\rx"));
    }

    @Test
    void lasComasYLasComillasSimplesNoSeEntrecomillan() {
        assertEquals("uno, dos", VentasCsv.celda("uno, dos"));
        assertEquals("O'Hara", VentasCsv.celda("O'Hara"));
        assertEquals("a=b", VentasCsv.celda("a=b"));
    }

    @Test
    void solesEnLosLimites() {
        assertEquals("0.00", VentasCsv.soles(0));
        assertEquals("0.99", VentasCsv.soles(99));
        assertEquals("1.00", VentasCsv.soles(100));
        assertEquals("1.01", VentasCsv.soles(101));
        assertEquals("92233720368547758.07", VentasCsv.soles(Long.MAX_VALUE));
    }

    @Test
    void telefonosFueraDelPatronDeNueveDigitos() {
        assertEquals("12345678", VentasCsv.telefono("12345678"), "menos de 9 dígitos: tal cual");
        assertEquals("123 456 789", VentasCsv.telefono("123456789"), "justo 9: sin prefijo");
        assertEquals("1 234 567 890", VentasCsv.telefono("1234567890"), "un dígito de prefijo");
        assertEquals("519876 543 210 123", VentasCsv.telefono("519876543210123"), "15 dígitos: prefijo de 6");
    }
}

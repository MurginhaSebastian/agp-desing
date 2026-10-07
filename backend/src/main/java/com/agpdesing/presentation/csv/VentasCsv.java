package com.agpdesing.presentation.csv;

import com.agpdesing.domain.model.PaymentMethod;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleStatus;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Las ventas en un archivo que Excel abre bien en un Windows en español de Perú.
 *
 * - Separador `;`: es el separador de listas de Windows con la configuración es-PE. Con `,`
 *   Excel lo metería todo en una columna.
 * - Importes con punto decimal y dos cifras (`95.50`): en es-PE el decimal es el punto, así Excel
 *   los lee como números y se pueden sumar.
 * - UTF-8 con BOM al principio y SIN la línea `sep=;`: sin BOM, Excel rompe las tildes; con
 *   `sep=;`, Excel ignora el BOM y también las rompe.
 * - Teléfono agrupado («51 987 654 321»): solo con dígitos, Excel lo tomaría por un número y lo
 *   enseñaría como 5,19877E+10.
 * - **Inyección de fórmulas**: un nombre o un detalle que empiece por `=`, `+`, `-`, `@`, tabulador
 *   o retorno de carro se escribe con un `'` delante. Si no, un «cliente» llamado
 *   `=HYPERLINK("http://…")` se ejecutaría al abrir el archivo.
 */
public final class VentasCsv {

    private static final String BOM = "﻿";
    private static final String FIN = "\r\n";

    private static final List<String> CABECERA = List.of("Fecha", "Cliente", "Teléfono", "Qué se vendió", "Detalle",
            "Cantidad", "Total (S/)", "Adelanto (S/)", "Saldo (S/)", "Pago", "Estado", "Entrega");

    private static final Map<PaymentMethod, String> PAGO = Map.of(
            PaymentMethod.YAPE, "Yape", PaymentMethod.TRANSFER, "Transferencia",
            PaymentMethod.CASH_ON_DELIVERY, "Contraentrega");

    private static final Map<SaleStatus, String> ESTADO = Map.of(
            SaleStatus.PENDING, "Pendiente", SaleStatus.IN_PRODUCTION, "En producción",
            SaleStatus.DELIVERED, "Entregada", SaleStatus.CANCELLED, "Cancelada");

    private VentasCsv() {
    }

    public static byte[] escribir(List<Sale> ventas) {
        StringBuilder sb = new StringBuilder(BOM);
        fila(sb, CABECERA);
        for (Sale v : ventas) {
            fila(sb, List.of(
                    v.saleDate().toString(),
                    v.customerName(),
                    telefono(v.customerPhone()),
                    v.item(),
                    v.detail(),
                    String.valueOf(v.quantity()),
                    soles(v.totalCents()),
                    soles(v.advanceCents()),
                    soles(v.balanceCents()),
                    PAGO.get(v.paymentMethod()),
                    ESTADO.get(v.status()),
                    v.deliveryDate().map(Object::toString).orElse("")));
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static void fila(StringBuilder sb, List<String> celdas) {
        for (int i = 0; i < celdas.size(); i++) {
            if (i > 0) sb.append(';');
            sb.append(celda(celdas.get(i)));
        }
        sb.append(FIN);
    }

    /** Escapa una celda: neutraliza fórmulas y entrecomilla si lleva `;`, comillas o saltos de línea. */
    static String celda(String valor) {
        String v = valor == null ? "" : valor;
        if (!v.isEmpty() && "=+-@\t\r".indexOf(v.charAt(0)) >= 0) v = "'" + v;
        if (v.contains(";") || v.contains("\"") || v.contains("\n") || v.contains("\r")) {
            v = "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }

    /** 9500 → «95.00». */
    static String soles(long cents) {
        return String.format(java.util.Locale.ROOT, "%d.%02d", cents / 100, cents % 100);
    }

    /** «51987654321» → «51 987 654 321»: los últimos nueve en grupos de tres y el prefijo delante. */
    static String telefono(String digitos) {
        if (digitos.length() < 9) return digitos;
        String local = digitos.substring(digitos.length() - 9);
        String prefijo = digitos.substring(0, digitos.length() - 9);
        String agrupado = local.substring(0, 3) + " " + local.substring(3, 6) + " " + local.substring(6);
        return prefijo.isEmpty() ? agrupado : prefijo + " " + agrupado;
    }
}

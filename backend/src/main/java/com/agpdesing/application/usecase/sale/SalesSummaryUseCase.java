package com.agpdesing.application.usecase.sale;

import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.repository.SaleRepository;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Los números del mes: cuánto se vendió, cuánto el mes anterior, cuánto falta cobrar y qué se
 * vende más. Las canceladas no cuentan en nada.
 *
 * Se calcula en memoria sobre las ventas del periodo: un taller vende decenas al mes, no miles.
 * Si algún día hiciera falta, se pasa a consultas SQL sin cambiar quién lo usa.
 */
public class SalesSummaryUseCase {

    /** Una línea de «lo más vendido». `productId` vacío = encargos a medida o una obra ya borrada. */
    public record TopItem(Optional<ProductId> productId, String item, int quantity, long totalCents) {}

    public record Summary(YearMonth month, long totalCents, long previousMonthTotalCents, long pendingCents,
                          int salesCount, List<TopItem> topItems) {}

    private static final int TOP = 5;

    private final SaleRepository sales;

    public SalesSummaryUseCase(SaleRepository sales) {
        this.sales = sales;
    }

    public Summary of(YearMonth month) {
        List<Sale> delMes = vigentes(month);
        long total = delMes.stream().mapToLong(Sale::totalCents).sum();
        long anterior = vigentes(month.minusMonths(1)).stream().mapToLong(Sale::totalCents).sum();
        long porCobrar = delMes.stream().mapToLong(Sale::balanceCents).sum();
        return new Summary(month, total, anterior, porCobrar, delMes.size(), masVendido(delMes));
    }

    private List<Sale> vigentes(YearMonth month) {
        return sales.findBetween(month.atDay(1), month.atEndOfMonth()).stream().filter((s) -> !s.cancelled()).toList();
    }

    /**
     * Por obra si la venta tiene una; si no, por el nombre de lo vendido. Así, las ventas de una
     * obra que luego se borró (y perdió su `productId`) siguen juntas bajo su nombre.
     */
    private static List<TopItem> masVendido(List<Sale> ventas) {
        Map<String, TopItem> grupos = new LinkedHashMap<>();
        for (Sale s : ventas) {
            String clave = s.productId().map((id) -> "obra:" + id.value()).orElse("item:" + s.item().toLowerCase());
            grupos.merge(clave, new TopItem(s.productId(), s.item(), s.quantity(), s.totalCents()),
                    (a, b) -> new TopItem(a.productId(), a.item(), a.quantity() + b.quantity(), a.totalCents() + b.totalCents()));
        }
        List<TopItem> lista = new ArrayList<>(grupos.values());
        lista.sort(Comparator.comparingInt(TopItem::quantity).thenComparingLong(TopItem::totalCents).reversed());
        return lista.subList(0, Math.min(TOP, lista.size()));
    }
}

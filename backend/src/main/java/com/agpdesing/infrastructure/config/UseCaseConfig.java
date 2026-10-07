package com.agpdesing.infrastructure.config;

import com.agpdesing.application.port.out.ImageStorage;
import com.agpdesing.application.port.out.PasswordHasher;
import com.agpdesing.application.port.out.TokenProvider;
import com.agpdesing.application.port.out.Transacciones;
import com.agpdesing.application.usecase.auth.AuthenticateAdminUseCase;
import com.agpdesing.application.usecase.image.UploadImageUseCase;
import com.agpdesing.application.usecase.product.CreateProductUseCase;
import com.agpdesing.application.usecase.product.DeleteProductUseCase;
import com.agpdesing.application.usecase.product.GetProductUseCase;
import com.agpdesing.application.usecase.product.ListProductsUseCase;
import com.agpdesing.application.usecase.product.UpdateProductUseCase;
import com.agpdesing.application.usecase.sale.QuerySalesUseCase;
import com.agpdesing.application.usecase.sale.SalesSummaryUseCase;
import com.agpdesing.application.usecase.sale.SaveSaleUseCase;
import com.agpdesing.application.usecase.settings.GetSiteSettingsUseCase;
import com.agpdesing.application.usecase.settings.UpdateSiteSettingsUseCase;
import com.agpdesing.domain.repository.AdminUserRepository;
import com.agpdesing.domain.repository.ProductRepository;
import com.agpdesing.domain.repository.SaleRepository;
import com.agpdesing.domain.repository.SiteSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.unit.DataSize;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Cablea los casos de uso con sus puertos. Reciben INTERFACES del dominio;
 * Spring inyecta los adaptadores de infraestructura. Así application/ y domain/
 * quedan sin una sola anotación de Spring.
 */
@Configuration
public class UseCaseConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    CreateProductUseCase createProductUseCase(ProductRepository repo, Clock clock, Transacciones tx) {
        return new CreateProductUseCase(repo, clock, tx);
    }

    @Bean
    UpdateProductUseCase updateProductUseCase(ProductRepository repo, Clock clock, Transacciones tx) {
        return new UpdateProductUseCase(repo, clock, tx);
    }

    @Bean
    DeleteProductUseCase deleteProductUseCase(ProductRepository repo, Transacciones tx) {
        return new DeleteProductUseCase(repo, tx);
    }

    @Bean
    GetProductUseCase getProductUseCase(ProductRepository repo) {
        return new GetProductUseCase(repo);
    }

    @Bean
    ListProductsUseCase listProductsUseCase(ProductRepository repo) {
        return new ListProductsUseCase(repo);
    }

    @Bean
    SaveSaleUseCase saveSaleUseCase(SaleRepository sales, ProductRepository products, Clock clock, Transacciones tx) {
        return new SaveSaleUseCase(sales, products, clock, tx);
    }

    @Bean
    QuerySalesUseCase querySalesUseCase(SaleRepository sales, Transacciones tx) {
        return new QuerySalesUseCase(sales, tx);
    }

    @Bean
    SalesSummaryUseCase salesSummaryUseCase(SaleRepository sales) {
        return new SalesSummaryUseCase(sales);
    }

    @Bean
    GetSiteSettingsUseCase getSiteSettingsUseCase(SiteSettingsRepository settings) {
        return new GetSiteSettingsUseCase(settings);
    }

    @Bean
    UpdateSiteSettingsUseCase updateSiteSettingsUseCase(SiteSettingsRepository settings) {
        return new UpdateSiteSettingsUseCase(settings);
    }

    /**
     * El tope de tamaño se lee de la MISMA propiedad que usa Spring para cortar la subida
     * (`spring.servlet.multipart.max-file-size`). Con dos números distintos, uno de los dos
     * mensajes de error mentiría.
     */
    @Bean
    UploadImageUseCase uploadImageUseCase(ImageStorage almacen,
                                          @Value("${spring.servlet.multipart.max-file-size}") DataSize maxArchivo) {
        return new UploadImageUseCase(almacen, maxArchivo.toBytes());
    }

    @Bean
    AuthenticateAdminUseCase authenticateAdminUseCase(AdminUserRepository users, PasswordHasher hasher, TokenProvider tokens) {
        return new AuthenticateAdminUseCase(users, hasher, tokens);
    }
}

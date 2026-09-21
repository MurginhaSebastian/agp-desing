package com.agpdesing.infrastructure.config;

import com.agpdesing.application.port.out.PasswordHasher;
import com.agpdesing.application.port.out.TokenProvider;
import com.agpdesing.application.usecase.auth.AuthenticateAdminUseCase;
import com.agpdesing.application.usecase.product.CreateProductUseCase;
import com.agpdesing.application.usecase.product.DeleteProductUseCase;
import com.agpdesing.application.usecase.product.GetProductUseCase;
import com.agpdesing.application.usecase.product.ListProductsUseCase;
import com.agpdesing.application.usecase.product.UpdateProductUseCase;
import com.agpdesing.domain.repository.AdminUserRepository;
import com.agpdesing.domain.repository.ProductRepository;
import com.agpdesing.infrastructure.security.jwt.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Cablea los casos de uso con sus puertos. Reciben INTERFACES del dominio;
 * Spring inyecta los adaptadores de infraestructura. Así application/ y domain/
 * quedan sin una sola anotación de Spring.
 */
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class UseCaseConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    CreateProductUseCase createProductUseCase(ProductRepository repo, Clock clock) {
        return new CreateProductUseCase(repo, clock);
    }

    @Bean
    UpdateProductUseCase updateProductUseCase(ProductRepository repo, Clock clock) {
        return new UpdateProductUseCase(repo, clock);
    }

    @Bean
    DeleteProductUseCase deleteProductUseCase(ProductRepository repo) {
        return new DeleteProductUseCase(repo);
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
    AuthenticateAdminUseCase authenticateAdminUseCase(AdminUserRepository users, PasswordHasher hasher, TokenProvider tokens) {
        return new AuthenticateAdminUseCase(users, hasher, tokens);
    }
}

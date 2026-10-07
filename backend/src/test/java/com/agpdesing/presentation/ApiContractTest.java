package com.agpdesing.presentation;

import com.agpdesing.application.TransaccionesDePrueba;
import com.agpdesing.application.port.out.ImageStorage;
import com.agpdesing.application.port.out.PasswordHasher;
import com.agpdesing.application.port.out.TokenProvider;
import com.agpdesing.application.usecase.auth.AuthenticateAdminUseCase;
import com.agpdesing.application.usecase.image.UploadImageUseCase;
import com.agpdesing.application.usecase.product.CreateProductUseCase;
import com.agpdesing.application.usecase.product.DeleteProductUseCase;
import com.agpdesing.application.usecase.product.GetProductUseCase;
import com.agpdesing.application.usecase.product.ListProductsUseCase;
import com.agpdesing.application.usecase.product.UpdateProductUseCase;
import com.agpdesing.application.usecase.settings.GetSiteSettingsUseCase;
import com.agpdesing.application.usecase.settings.UpdateSiteSettingsUseCase;
import com.agpdesing.domain.model.AdminUser;
import com.agpdesing.domain.model.Money;
import com.agpdesing.domain.model.Product;
import com.agpdesing.domain.model.ProductId;
import com.agpdesing.domain.model.ProductStatus;
import com.agpdesing.domain.model.SiteSettings;
import com.agpdesing.domain.repository.ProductRepository;
import com.agpdesing.domain.repository.SiteSettingsRepository;
import com.agpdesing.infrastructure.security.CorsConfig;
import com.agpdesing.infrastructure.security.SecurityConfig;
import com.agpdesing.infrastructure.security.jwt.JwtAuthenticationFilter;
import com.agpdesing.presentation.mapper.AuthDtoMapper;
import com.agpdesing.presentation.mapper.ProductDtoMapper;
import com.agpdesing.presentation.mapper.SettingsDtoMapper;
import com.agpdesing.presentation.ratelimit.ClientIpResolver;
import com.agpdesing.presentation.ratelimit.LoginRateLimiter;
import com.agpdesing.presentation.ratelimit.SubidaRateLimiter;
import com.agpdesing.presentation.rest.AuthController;
import com.agpdesing.presentation.rest.ImageController;
import com.agpdesing.presentation.rest.ProductController;
import com.agpdesing.presentation.rest.SaleController;
import com.agpdesing.presentation.rest.SettingsController;
import com.agpdesing.presentation.mapper.SaleDtoMapper;
import com.agpdesing.application.usecase.sale.QuerySalesUseCase;
import com.agpdesing.application.usecase.sale.SaveSaleUseCase;
import com.agpdesing.application.usecase.sale.SalesSummaryUseCase;
import com.agpdesing.domain.model.Sale;
import com.agpdesing.domain.model.SaleId;
import com.agpdesing.domain.repository.SaleRepository;
import java.time.LocalDate;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Contrato HTTP de la API tal y como está: rutas, permisos, códigos y cuerpos JSON.
 *
 * Usa la cadena de seguridad, el filtro JWT, los controladores, los mappers y el manejador de
 * errores de verdad; lo único falso son los puertos (repositorios en memoria, un emisor de tokens
 * que acepta «Bearer ok-<usuario>» y un almacén de fotos de quita y pon). Sirve para reorganizar
 * el backend por dentro y demostrar que por fuera responde exactamente igual.
 */
@WebMvcTest(
        controllers = { ProductController.class, SettingsController.class, AuthController.class, ImageController.class,
                SaleController.class },
        properties = { "app.cors.allowed-origin=http://localhost:5173", "app.ratelimit.trusted-proxy-hops=0" })
@Import({ SecurityConfig.class, CorsConfig.class, JwtAuthenticationFilter.class, ClientIpResolver.class,
        LoginRateLimiter.class, SubidaRateLimiter.class, ProductDtoMapper.class, SettingsDtoMapper.class,
        AuthDtoMapper.class, SaleDtoMapper.class, ApiContractTest.Puertos.class })
class ApiContractTest {

    static final Instant AHORA = Instant.parse("2026-09-21T10:00:00Z");

    @Autowired MockMvc mvc;
    @Autowired Productos productos;
    @Autowired Ajustes ajustes;
    @Autowired Almacen almacen;
    @Autowired Ventas ventas;

    /** Cada test entra con un usuario distinto para no compartir el cupo de subidas. */
    private static final AtomicInteger usuarios = new AtomicInteger();
    /** Y desde una IP distinta, para no compartir el cupo de intentos de login. */
    private static final AtomicInteger ips = new AtomicInteger(1);

    @BeforeEach
    void limpiar() {
        productos.store.clear();
        ajustes.actual = SiteSettings.empty();
        almacen.modo.set("ok");
        ventas.store.clear();
    }

    private static RequestPostProcessor admin() {
        String token = "ok-admin" + usuarios.incrementAndGet();
        return req -> { req.addHeader("Authorization", "Bearer " + token); return req; };
    }

    private static RequestPostProcessor desdeOtraIp() {
        String ip = "10.0." + (ips.get() / 250) + "." + (ips.getAndIncrement() % 250);
        return req -> { req.setRemoteAddr(ip); return req; };
    }

    private Product guardado(String nombre, boolean destacado) {
        Product p = Product.create(nombre, "Descripción", new Money(9_500, Money.Currency.PEN), 30, 40, "Acrílico",
                "https://cdn.example/a.jpg", ProductStatus.AVAILABLE, destacado, AHORA);
        return productos.save(p);
    }

    private static final String CUERPO_VALIDO = """
            {"name":"Tarde en Bordeaux","description":"  hola  ","priceCents":9500,"currency":"PEN",
             "widthCm":30,"heightCm":40,"technique":"Acrílico","imageUrl":"/images/obras/01.svg",
             "status":"AVAILABLE","featured":true}""";

    private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder b, String cuerpo) {
        return b.contentType(MediaType.APPLICATION_JSON).content(cuerpo);
    }

    @Nested
    class Productos_ {

        @Test
        void listaPublicaConElCuerpoCompleto() throws Exception {
            Product p = guardado("Seda I", true);
            mvc.perform(get("/api/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id").value(p.id().value().toString()))
                    .andExpect(jsonPath("$[0].name").value("Seda I"))
                    .andExpect(jsonPath("$[0].slug").value("seda-i"))
                    .andExpect(jsonPath("$[0].description").value("Descripción"))
                    .andExpect(jsonPath("$[0].priceCents").value(9500))
                    .andExpect(jsonPath("$[0].currency").value("PEN"))
                    .andExpect(jsonPath("$[0].widthCm").value(30))
                    .andExpect(jsonPath("$[0].heightCm").value(40))
                    .andExpect(jsonPath("$[0].technique").value("Acrílico"))
                    .andExpect(jsonPath("$[0].imageUrl").value("https://cdn.example/a.jpg"))
                    .andExpect(jsonPath("$[0].status").value("AVAILABLE"))
                    .andExpect(jsonPath("$[0].featured").value(true))
                    .andExpect(jsonPath("$[0].createdAt").value("2026-09-21T10:00:00Z"))
                    .andExpect(jsonPath("$[0].updatedAt").value("2026-09-21T10:00:00Z"))
                    .andExpect(jsonPath("$[0].length()").value(14));
        }

        @Test
        void fichaPorSlugEsPublica() throws Exception {
            guardado("Seda I", false);
            mvc.perform(get("/api/products/slug/seda-i"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slug").value("seda-i"));
            mvc.perform(get("/api/products/slug/no-existe"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title").value("No encontrado"))
                    .andExpect(jsonPath("$.status").value(404));
        }

        @Test
        void porIdSoloConSesion() throws Exception {
            Product p = guardado("Seda I", false);
            String ruta = "/api/products/" + p.id().value();
            mvc.perform(get(ruta)).andExpect(status().isUnauthorized());
            mvc.perform(get(ruta).header("Authorization", "Bearer token-falso")).andExpect(status().isUnauthorized());
            mvc.perform(get(ruta).with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(p.id().value().toString()));
            mvc.perform(get("/api/products/" + UUID.randomUUID()).with(admin()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title").value("No encontrado"));
            mvc.perform(get("/api/products/no-es-uuid").with(admin()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.detail").value("No existe un cuadro con ese identificador"));
        }

        @Test
        void altaConSesion() throws Exception {
            mvc.perform(json(post("/api/products"), CUERPO_VALIDO)).andExpect(status().isUnauthorized());
            mvc.perform(json(post("/api/products"), CUERPO_VALIDO).with(admin()))
                    .andExpect(status().isCreated())
                    .andExpect(header().string("Location", startsWith("/api/products/")))
                    .andExpect(jsonPath("$.slug").value("tarde-en-bordeaux"))
                    .andExpect(jsonPath("$.description").value("hola"))
                    .andExpect(jsonPath("$.featured").value(true))
                    .andExpect(jsonPath("$.createdAt").value("2026-09-21T10:00:00Z"));
        }

        @Test
        void altaRepetidaEsConflicto() throws Exception {
            guardado("Tarde en Bordeaux", false);
            mvc.perform(json(post("/api/products"), CUERPO_VALIDO).with(admin()))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.title").value("Conflicto"))
                    .andExpect(jsonPath("$.errors.name").exists());
        }

        @Test
        void altaInvalidaMarcaLosCampos() throws Exception {
            String malo = CUERPO_VALIDO.replace("\"widthCm\":30", "\"widthCm\":1001")
                    .replace("/images/obras/01.svg", "ftp://x");
            mvc.perform(json(post("/api/products"), malo).with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title").value("Datos inválidos"))
                    .andExpect(jsonPath("$.detail").value("Revisa los campos marcados"))
                    .andExpect(jsonPath("$.errors.widthCm").exists())
                    .andExpect(jsonPath("$.errors.imageUrl").value("Debe ser una URL http(s) o una ruta que empiece por /"));
            mvc.perform(json(post("/api/products"), "{no es json").with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title").value("Petición malformada"));
        }

        @Test
        void edicionYBorrado() throws Exception {
            Product p = guardado("Seda I", false);
            String ruta = "/api/products/" + p.id().value();
            mvc.perform(json(put(ruta), CUERPO_VALIDO)).andExpect(status().isUnauthorized());
            mvc.perform(json(put(ruta), CUERPO_VALIDO).with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.slug").value("tarde-en-bordeaux"))
                    .andExpect(jsonPath("$.createdAt").value("2026-09-21T10:00:00Z"));
            mvc.perform(json(put("/api/products/" + UUID.randomUUID()), CUERPO_VALIDO).with(admin()))
                    .andExpect(status().isNotFound());
            mvc.perform(delete(ruta)).andExpect(status().isUnauthorized());
            mvc.perform(delete(ruta).with(admin())).andExpect(status().isNoContent());
            mvc.perform(delete(ruta).with(admin())).andExpect(status().isNotFound());
        }

        /** Antes acababa en el comodín y respondía 500, como si el servidor se hubiera roto. */
        @Test
        void metodoNoAdmitidoEs405() throws Exception {
            mvc.perform(patch("/api/products").with(admin()))
                    .andExpect(status().isMethodNotAllowed())
                    .andExpect(header().string("Allow", org.hamcrest.Matchers.containsString("GET")))
                    .andExpect(jsonPath("$.title").value("Método no admitido"))
                    .andExpect(jsonPath("$.status").value(405));
        }

        /** Una ruta que no existe dentro de /api/products: 404, no 500. */
        @Test
        void rutaInexistenteEs404() throws Exception {
            mvc.perform(get("/api/products/a/b").with(admin()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title").value("No encontrado"))
                    .andExpect(jsonPath("$.status").value(404));
        }
    }

    @Nested
    class Ajustes_ {

        @Test
        void lecturaPublica() throws Exception {
            mvc.perform(get("/api/settings"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.heroImageUrl").value(""))
                    .andExpect(jsonPath("$.length()").value(1));
        }

        @Test
        void cambioConSesion() throws Exception {
            // Espacios al final: el dominio los quita. Al principio, el DTO la rechaza (lo fija el último caso).
            String cuerpo = "{\"heroImageUrl\":\"https://cdn.example/portada.jpg  \"}";
            mvc.perform(json(put("/api/settings"), cuerpo)).andExpect(status().isUnauthorized());
            mvc.perform(json(put("/api/settings"), cuerpo).with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.heroImageUrl").value("https://cdn.example/portada.jpg"));
            mvc.perform(json(put("/api/settings"), "{\"heroImageUrl\":\"javascript:alert(1)\"}").with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.heroImageUrl").exists());
            mvc.perform(json(put("/api/settings"), "{\"heroImageUrl\":\" https://cdn.example/x.jpg\"}").with(admin()))
                    .andExpect(status().isBadRequest());
            mvc.perform(json(put("/api/settings"), "{}").with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.heroImageUrl").value(""));
        }
    }

    @Nested
    class Login {

        @Test
        void entradaCorrectaDevuelveElToken() throws Exception {
            mvc.perform(json(post("/api/auth/login"), "{\"username\":\"admin\",\"password\":\"clave-buena\"}").with(desdeOtraIp()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").value("ok-admin"))
                    .andExpect(jsonPath("$.expiresAt").value("2026-09-21T18:00:00Z"))
                    .andExpect(jsonPath("$.username").value("admin"))
                    .andExpect(jsonPath("$.length()").value(3));
        }

        /**
         * El límite es de 72 BYTES (lo que mira BCrypt), no de 72 caracteres: el DTO ya no lo cuenta
         * por su lado. Una clave demasiado larga responde igual que una equivocada.
         */
        @Test
        void claveDemasiadoLargaEsComoUnaEquivocada() throws Exception {
            String larga = "a".repeat(73);
            mvc.perform(json(post("/api/auth/login"), "{\"username\":\"admin\",\"password\":\"" + larga + "\"}").with(desdeOtraIp()))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.title").value("No autorizado"));
        }

        @Test
        void claveMalaEs401() throws Exception {
            mvc.perform(json(post("/api/auth/login"), "{\"username\":\"admin\",\"password\":\"otra\"}").with(desdeOtraIp()))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.title").value("No autorizado"));
        }

        @Test
        void cuerpoInvalidoEs400() throws Exception {
            mvc.perform(json(post("/api/auth/login"), "{\"username\":\"\",\"password\":\"x\"}").with(desdeOtraIp()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.username").exists());
        }

        @Test
        void elSextoIntentoSeFrena() throws Exception {
            RequestPostProcessor ip = desdeOtraIp();
            for (int i = 0; i < 5; i++) {
                mvc.perform(json(post("/api/auth/login"), "{\"username\":\"admin\",\"password\":\"otra\"}").with(ip))
                        .andExpect(status().isUnauthorized());
            }
            mvc.perform(json(post("/api/auth/login"), "{\"username\":\"admin\",\"password\":\"clave-buena\"}").with(ip))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(jsonPath("$.detail").value("Demasiados intentos. Espera un minuto."))
                    .andExpect(jsonPath("$.status").value(429));
        }
    }

    @Nested
    class Fotos {

        private MockMultipartFile archivo(byte[] bytes) {
            return new MockMultipartFile("archivo", "foto.png", "image/png", bytes);
        }

        @Test
        void sinSesionEs401() throws Exception {
            mvc.perform(multipart("/api/imagenes").file(archivo(png()))).andExpect(status().isUnauthorized());
        }

        @Test
        void subidaCorrectaDevuelveLaDireccion() throws Exception {
            mvc.perform(multipart("/api/imagenes").file(archivo(png())).with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.url", startsWith("https://almacen.example/")))
                    .andExpect(jsonPath("$.url", endsWith(".png")))
                    .andExpect(jsonPath("$.length()").value(1));
        }

        @Test
        void formatoNoAdmitidoEs415() throws Exception {
            byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>".getBytes();
            mvc.perform(multipart("/api/imagenes").file(archivo(svg)).with(admin()))
                    .andExpect(status().isUnsupportedMediaType())
                    .andExpect(jsonPath("$.title").value("Formato no admitido"))
                    .andExpect(jsonPath("$.errors.archivo").exists());
        }

        @Test
        void archivoVacioEs400() throws Exception {
            mvc.perform(multipart("/api/imagenes").file(archivo(new byte[0])).with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title").value("Datos inválidos"))
                    .andExpect(jsonPath("$.errors.archivo").exists());
        }

        @Test
        void imagenRotaEs400() throws Exception {
            byte[] roto = new byte[40];
            roto[0] = (byte) 0xFF; roto[1] = (byte) 0xD8; roto[2] = (byte) 0xFF; roto[3] = (byte) 0xE1;
            mvc.perform(multipart("/api/imagenes").file(archivo(roto)).with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title").value("Imagen ilegible"));
        }

        @Test
        void faltaElArchivoEs400() throws Exception {
            mvc.perform(multipart("/api/imagenes").with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title").value("Falta el archivo"));
        }

        @Test
        void sinFormularioEs415() throws Exception {
            mvc.perform(json(post("/api/imagenes"), "{}").with(admin()))
                    .andExpect(status().isUnsupportedMediaType())
                    .andExpect(jsonPath("$.title").value("Envío no admitido"));
        }

        @Test
        void almacenSinConfigurarEs503YCaidoEs502() throws Exception {
            almacen.modo.set("sin-configurar");
            mvc.perform(multipart("/api/imagenes").file(archivo(png())).with(admin()))
                    .andExpect(status().isServiceUnavailable())
                    .andExpect(jsonPath("$.title").value("Subida no disponible"));
            almacen.modo.set("caido");
            mvc.perform(multipart("/api/imagenes").file(archivo(png())).with(admin()))
                    .andExpect(status().isBadGateway())
                    .andExpect(jsonPath("$.title").value("No se pudo guardar la foto"));
        }

        @Test
        void laSubida21SeFrena() throws Exception {
            RequestPostProcessor mismo = admin();
            for (int i = 0; i < 20; i++) {
                mvc.perform(multipart("/api/imagenes").file(archivo(png())).with(mismo)).andExpect(status().isOk());
            }
            mvc.perform(multipart("/api/imagenes").file(archivo(png())).with(mismo))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(jsonPath("$.title").value("Demasiadas subidas"));
        }
    }


    /** Ventas: nombres y teléfonos de clientes. Nada de esto puede salir sin sesión. */
    @Nested
    class Ventas_ {

        private static final String VENTA = """
                {"item":"Cuadro de la promo 2010","detail":"  Fotos del viaje  ","quantity":2,"totalCents":15050,
                 "advanceCents":5000,"paymentMethod":"YAPE","status":"PENDING","customerName":"Ana Torres",
                 "customerPhone":"+51 987 654 321","saleDate":"2026-09-20","deliveryDate":"2026-09-27"}""";

        private String conObra(Product p, boolean marcar) {
            return "{\"productId\":\"" + p.id().value() + "\",\"quantity\":1,\"totalCents\":9500,\"advanceCents\":0,"
                    + "\"paymentMethod\":\"TRANSFER\",\"status\":\"DELIVERED\",\"customerName\":\"Luis\","
                    + "\"customerPhone\":\"912345678\",\"saleDate\":\"2026-09-10\",\"markProductSold\":" + marcar + "}";
        }

        @Test
        void sinSesionNadaResponde() throws Exception {
            String id = "/api/sales/" + UUID.randomUUID();
            mvc.perform(get("/api/sales")).andExpect(status().isUnauthorized());
            mvc.perform(get(id)).andExpect(status().isUnauthorized());
            mvc.perform(get("/api/sales/resumen")).andExpect(status().isUnauthorized());
            mvc.perform(get("/api/sales/export.csv")).andExpect(status().isUnauthorized());
            mvc.perform(json(post("/api/sales"), VENTA)).andExpect(status().isUnauthorized());
            mvc.perform(json(put(id), VENTA)).andExpect(status().isUnauthorized());
            mvc.perform(delete(id)).andExpect(status().isUnauthorized());
            mvc.perform(get("/api/sales").header("Authorization", "Bearer token-falso")).andExpect(status().isUnauthorized());
        }

        @Test
        void altaDeUnEncargoAMedidaConElCuerpoCompleto() throws Exception {
            mvc.perform(json(post("/api/sales"), VENTA).with(admin()))
                    .andExpect(status().isCreated())
                    .andExpect(header().string("Location", startsWith("/api/sales/")))
                    .andExpect(jsonPath("$.id").exists())
                    .andExpect(jsonPath("$.productId").value(org.hamcrest.Matchers.nullValue()))
                    .andExpect(jsonPath("$.item").value("Cuadro de la promo 2010"))
                    .andExpect(jsonPath("$.detail").value("Fotos del viaje"))
                    .andExpect(jsonPath("$.quantity").value(2))
                    .andExpect(jsonPath("$.totalCents").value(15050))
                    .andExpect(jsonPath("$.advanceCents").value(5000))
                    .andExpect(jsonPath("$.balanceCents").value(10050))
                    .andExpect(jsonPath("$.paymentMethod").value("YAPE"))
                    .andExpect(jsonPath("$.status").value("PENDING"))
                    .andExpect(jsonPath("$.customerName").value("Ana Torres"))
                    .andExpect(jsonPath("$.customerPhone").value("51987654321"))
                    .andExpect(jsonPath("$.saleDate").value("2026-09-20"))
                    .andExpect(jsonPath("$.deliveryDate").value("2026-09-27"))
                    .andExpect(jsonPath("$.createdAt").value("2026-09-21T10:00:00Z"))
                    .andExpect(jsonPath("$.updatedAt").value("2026-09-21T10:00:00Z"))
                    .andExpect(jsonPath("$.length()").value(16));
        }

        @Test
        void ventaDeUnaObraLaMarcaVendidaSoloSiSePide() throws Exception {
            Product a = guardado("Seda I", false);
            Product b = guardado("Bruma", false);
            mvc.perform(json(post("/api/sales"), conObra(a, true)).with(admin()))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.item").value("Seda I"))
                    .andExpect(jsonPath("$.productId").value(a.id().value().toString()));
            mvc.perform(json(post("/api/sales"), conObra(b, false)).with(admin())).andExpect(status().isCreated());
            mvc.perform(get("/api/products/slug/seda-i")).andExpect(jsonPath("$.status").value("SOLD"));
            mvc.perform(get("/api/products/slug/bruma")).andExpect(jsonPath("$.status").value("AVAILABLE"));
        }

        @Test
        void obraQueNoExisteEs404() throws Exception {
            Product fantasma = Product.create("Fantasma", "", new Money(100, Money.Currency.PEN), 1, 1, "x", "/a.jpg",
                    ProductStatus.AVAILABLE, false, AHORA);
            mvc.perform(json(post("/api/sales"), conObra(fantasma, true)).with(admin()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title").value("No encontrado"));
        }

        @Test
        void datosInvalidosMarcanElCampo() throws Exception {
            mvc.perform(json(post("/api/sales"), VENTA.replace("\"advanceCents\":5000", "\"advanceCents\":99999")).with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.advanceCents").value("El adelanto no puede ser mayor que el total"));
            mvc.perform(json(post("/api/sales"), VENTA.replace("+51 987 654 321", "abc")).with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.customerPhone").exists());
            mvc.perform(json(post("/api/sales"), VENTA.replace("\"paymentMethod\":\"YAPE\",", "")).with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.paymentMethod").exists());
            mvc.perform(json(post("/api/sales"), VENTA.replace("\"YAPE\"", "\"PLIN\"")).with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title").value("Petición malformada"));
        }

        @Test
        void listaDelMesFiltrosYErroresDeFechas() throws Exception {
            mvc.perform(json(post("/api/sales"), VENTA).with(admin())).andExpect(status().isCreated());
            mvc.perform(json(post("/api/sales"), VENTA.replace("2026-09-20", "2026-08-05").replace("2026-09-27", "2026-08-06")).with(admin()))
                    .andExpect(status().isCreated());
            // Sin fechas: el mes en curso (el reloj del test está en septiembre de 2026).
            mvc.perform(get("/api/sales").with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].saleDate").value("2026-09-20"));
            mvc.perform(get("/api/sales?desde=2026-08-01&hasta=2026-09-30").with(admin()))
                    .andExpect(jsonPath("$", hasSize(2)));
            mvc.perform(get("/api/sales?desde=2026-09-30&hasta=2026-09-01").with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.hasta").exists());
            mvc.perform(get("/api/sales?desde=ayer").with(admin()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.detail").value("Revisa las fechas de la búsqueda"));
            mvc.perform(get("/api/sales/no-es-uuid").with(admin()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.detail").value("No existe una venta con ese identificador"));
        }

        @Test
        void edicionYBorrado() throws Exception {
            String location = mvc.perform(json(post("/api/sales"), VENTA).with(admin()))
                    .andReturn().getResponse().getHeader("Location");
            mvc.perform(json(put(location), VENTA.replace("PENDING", "DELIVERED").replace("\"advanceCents\":5000", "\"advanceCents\":15050")).with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("DELIVERED"))
                    .andExpect(jsonPath("$.balanceCents").value(0));
            mvc.perform(json(put("/api/sales/" + UUID.randomUUID()), VENTA).with(admin())).andExpect(status().isNotFound());
            mvc.perform(delete(location).with(admin())).andExpect(status().isNoContent());
            mvc.perform(delete(location).with(admin())).andExpect(status().isNotFound());
        }

        @Test
        void resumenDelMes() throws Exception {
            Product a = guardado("Seda I", false);
            mvc.perform(json(post("/api/sales"), VENTA).with(admin()));
            mvc.perform(json(post("/api/sales"), conObra(a, false)).with(admin()));
            mvc.perform(get("/api/sales/resumen?mes=2026-09").with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.month").value("2026-09"))
                    .andExpect(jsonPath("$.totalCents").value(15050 + 9500))
                    .andExpect(jsonPath("$.previousMonthTotalCents").value(0))
                    .andExpect(jsonPath("$.pendingCents").value(10050 + 9500)) // entregada sin cobrar: sigue por cobrar
                    .andExpect(jsonPath("$.salesCount").value(2))
                    .andExpect(jsonPath("$.topItems[0].item").value("Cuadro de la promo 2010"))
                    .andExpect(jsonPath("$.topItems[0].quantity").value(2))
                    .andExpect(jsonPath("$.topItems[1].productId").value(a.id().value().toString()));
            mvc.perform(get("/api/sales/resumen").with(admin())).andExpect(jsonPath("$.month").value("2026-09"));
        }

        @Test
        void exportarParaExcel() throws Exception {
            mvc.perform(json(post("/api/sales"), VENTA.replace("Ana Torres", "=HYPERLINK(\\\"http://x\\\")")).with(admin()))
                    .andExpect(status().isCreated());
            var r = mvc.perform(get("/api/sales/export.csv?desde=2026-09-01&hasta=2026-09-30").with(admin()))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Type", startsWith("text/csv")))
                    .andExpect(header().string("Content-Disposition", "attachment; filename=\"ventas-2026-09-01-a-2026-09-30.csv\""))
                    .andReturn().getResponse();
            String csv = new String(r.getContentAsByteArray(), StandardCharsets.UTF_8);
            org.junit.jupiter.api.Assertions.assertTrue(csv.startsWith("\uFEFFFecha;Cliente;"), csv.substring(0, 20));
            org.junit.jupiter.api.Assertions.assertTrue(csv.contains(";\"'=HYPERLINK(\"\"http://x\"\")\";"), "la fórmula va neutralizada: " + csv);
        }
    }

    @Nested
    class Seguridad {

        @Test
        void rutaDesconocidaSeNiega() throws Exception {
            mvc.perform(get("/api/otra")).andExpect(status().isUnauthorized());
            mvc.perform(get("/api/otra").with(admin())).andExpect(status().isForbidden());
        }

        @Test
        void cabecerasDeSeguridad() throws Exception {
            mvc.perform(get("/api/settings"))
                    .andExpect(header().string("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"))
                    .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        }

        @Test
        void corsSoloParaElOrigenDeLaWeb() throws Exception {
            mvc.perform(get("/api/settings").header("Origin", "http://localhost:5173"))
                    .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
            mvc.perform(get("/api/settings").header("Origin", "https://malo.example"))
                    .andExpect(status().isForbidden());
        }
    }

    private static byte[] png() throws IOException {
        var img = new BufferedImage(4, 3, BufferedImage.TYPE_INT_RGB);
        var out = new ByteArrayOutputStream();
        ImageIO.write(img, "png", out);
        return out.toByteArray();
    }

    // ------------------------------------------------------------------ puertos falsos

    static final class Productos implements ProductRepository {
        final Map<ProductId, Product> store = new ConcurrentHashMap<>();

        @Override public Product save(Product product) { store.put(product.id(), product); return product; }
        @Override public Optional<Product> findById(ProductId id) { return Optional.ofNullable(store.get(id)); }
        @Override public Optional<Product> findBySlug(String slug) {
            return store.values().stream().filter(p -> p.slug().equals(slug)).findFirst();
        }
        @Override public boolean existsBySlugAndIdNot(String slug, ProductId id) {
            return store.values().stream().anyMatch(p -> p.slug().equals(slug) && !p.id().equals(id));
        }
        @Override public List<Product> findAll() { return new ArrayList<>(store.values()); }
        @Override public void deleteById(ProductId id) { store.remove(id); }
    }

    static final class Ajustes implements SiteSettingsRepository {
        volatile SiteSettings actual = SiteSettings.empty();

        @Override public SiteSettings load() { return actual; }
        @Override public SiteSettings save(SiteSettings settings) { actual = settings; return settings; }
    }

    static final class Almacen implements ImageStorage {
        final AtomicReference<String> modo = new AtomicReference<>("ok");

        @Override public String guardar(String nombre, String tipoMime, byte[] contenido) {
            return switch (modo.get()) {
                case "sin-configurar" -> throw new com.agpdesing.application.exception.StorageNotConfiguredException("La subida de fotos no está configurada.");
                case "caido" -> throw new com.agpdesing.application.exception.StorageFailedException("El almacén no respondió.", null);
                default -> "https://almacen.example/" + nombre;
            };
        }
    }

    static final class Ventas implements SaleRepository {
        final Map<SaleId, Sale> store = new ConcurrentHashMap<>();

        @Override public Sale save(Sale s) { store.put(s.id(), s); return s; }
        @Override public Optional<Sale> findById(SaleId id) { return Optional.ofNullable(store.get(id)); }
        @Override public List<Sale> findBetween(LocalDate desde, LocalDate hasta) {
            return store.values().stream().filter(s -> !s.saleDate().isBefore(desde) && !s.saleDate().isAfter(hasta)).toList();
        }
        @Override public void deleteById(SaleId id) { store.remove(id); }
    }

    @TestConfiguration
    static class Puertos {
        final Clock clock = Clock.fixed(AHORA, ZoneOffset.UTC);
        /** Hash BCrypt de «clave-buena» con coste bajo, para que el test no tarde. */
        static final String HASH_DE_PRUEBA =
                new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(4).encode("clave-buena");

        @Bean Productos productos() { return new Productos(); }
        @Bean Ajustes ajustes() { return new Ajustes(); }
        @Bean Almacen almacen() { return new Almacen(); }
        @Bean Ventas ventas() { return new Ventas(); }
        @Bean Clock clock() { return clock; }

        @Bean TokenProvider tokenProvider() {
            return new TokenProvider() {
                @Override public IssuedToken issue(String subject) {
                    return new IssuedToken("ok-" + subject, AHORA.plusSeconds(8 * 3600));
                }
                @Override public Optional<String> validate(String token) {
                    return token.startsWith("ok-") ? Optional.of(token.substring(3)) : Optional.empty();
                }
            };
        }

        @Bean ListProductsUseCase list(Productos p) { return new ListProductsUseCase(p); }
        @Bean GetProductUseCase get(Productos p) { return new GetProductUseCase(p); }
        @Bean CreateProductUseCase create(Productos p) { return new CreateProductUseCase(p, clock, new TransaccionesDePrueba()); }
        @Bean UpdateProductUseCase update(Productos p) { return new UpdateProductUseCase(p, clock, new TransaccionesDePrueba()); }
        @Bean DeleteProductUseCase delete(Productos p) { return new DeleteProductUseCase(p, new TransaccionesDePrueba()); }
        @Bean GetSiteSettingsUseCase getSettings(Ajustes a) { return new GetSiteSettingsUseCase(a); }
        @Bean UpdateSiteSettingsUseCase updateSettings(Ajustes a) { return new UpdateSiteSettingsUseCase(a); }
        @Bean UploadImageUseCase upload(Almacen a) { return new UploadImageUseCase(a, 5L * 1024 * 1024); }
        @Bean SaveSaleUseCase saveSale(Ventas v, Productos p) { return new SaveSaleUseCase(v, p, clock, new TransaccionesDePrueba()); }
        @Bean QuerySalesUseCase querySales(Ventas v) { return new QuerySalesUseCase(v, new TransaccionesDePrueba()); }
        @Bean SalesSummaryUseCase salesSummary(Ventas v) { return new SalesSummaryUseCase(v); }

        @Bean AuthenticateAdminUseCase authenticate(TokenProvider tokens, PasswordHasher hasher) {
            return new AuthenticateAdminUseCase(
                    u -> "admin".equals(u) ? Optional.of(new AdminUser("admin", HASH_DE_PRUEBA)) : Optional.empty(),
                    hasher, tokens);
        }
    }
}

package com.agpdesing.presentation;

import com.agpdesing.presentation.ratelimit.ClientIpResolver;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * De qué IP se considera que viene cada intento de login. Es el cálculo del que depende el
 * freno: si se equivoca, o se puede probar contraseñas sin límite, o el dueño se queda fuera
 * de su propio panel.
 *
 * La rama que lee `X-Forwarded-For` solo se ejecuta en producción, así que esta es la única
 * forma de comprobarla sin desplegar.
 */
class ClientIpResolverTest {

    private static MockHttpServletRequest peticion(String ipDeLaConexion, String forwardedFor) {
        var request = new MockHttpServletRequest();
        request.setRemoteAddr(ipDeLaConexion);
        if (forwardedFor != null) request.addHeader("X-Forwarded-For", forwardedFor);
        return request;
    }

    @Test
    @DisplayName("sin proxies, la cabecera se ignora aunque venga falseada")
    void sinProxiesIgnoraLaCabecera() {
        var resolver = new ClientIpResolver(0);
        // Esto era el agujero: antes se creía el primer valor de la lista y cada intento
        // con una IP inventada caía en un contador nuevo.
        assertThat(resolver.resolve(peticion("203.0.113.9", "1.2.3.4"))).isEqualTo("203.0.113.9");
        assertThat(resolver.resolve(peticion("203.0.113.9", "1.1.1.1, 2.2.2.2, 3.3.3.3"))).isEqualTo("203.0.113.9");
    }

    @Test
    @DisplayName("con un proxy delante, se toma la IP que escribió ese proxy: la última")
    void conUnProxyTomaLaUltima() {
        var resolver = new ClientIpResolver(1);
        // El visitante puede escribir lo que quiera a la izquierda; el proxy añade a la derecha.
        assertThat(resolver.resolve(peticion("10.0.0.1", "1.1.1.1, 198.51.100.7"))).isEqualTo("198.51.100.7");
        assertThat(resolver.resolve(peticion("10.0.0.1", "198.51.100.7"))).isEqualTo("198.51.100.7");
    }

    @Test
    @DisplayName("con dos proxies, se salta el último y se toma el penúltimo")
    void conDosProxies() {
        var resolver = new ClientIpResolver(2);
        assertThat(resolver.resolve(peticion("10.0.0.1", "1.1.1.1, 198.51.100.7, 10.0.0.2")))
                .isEqualTo("198.51.100.7");
    }

    @Test
    @DisplayName("si la cabecera falta o viene vacía, se usa la IP de la conexión")
    void sinCabeceraUsaLaConexion() {
        var resolver = new ClientIpResolver(1);
        assertThat(resolver.resolve(peticion("203.0.113.9", null))).isEqualTo("203.0.113.9");
        assertThat(resolver.resolve(peticion("203.0.113.9", "   "))).isEqualTo("203.0.113.9");
        assertThat(resolver.resolve(peticion("203.0.113.9", ", "))).isEqualTo("203.0.113.9");
    }

    @Test
    @DisplayName("si la lista es más corta de lo esperado, se coge el valor más a la izquierda")
    void listaMasCortaDeLoEsperado() {
        // Configurado para dos proxies pero llega un solo valor: puede ser que alguien la
        // haya recortado. No se puede quedar sin clave, así que se usa lo que hay.
        var resolver = new ClientIpResolver(3);
        assertThat(resolver.resolve(peticion("10.0.0.1", "198.51.100.7"))).isEqualTo("198.51.100.7");
    }

    @Test
    @DisplayName("un número de proxies negativo se trata como cero")
    void numeroNegativo() {
        var resolver = new ClientIpResolver(-5);
        assertThat(resolver.resolve(peticion("203.0.113.9", "1.2.3.4"))).isEqualTo("203.0.113.9");
    }
}

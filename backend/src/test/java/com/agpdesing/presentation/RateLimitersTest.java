package com.agpdesing.presentation;

import com.agpdesing.presentation.ratelimit.LoginRateLimiter;
import com.agpdesing.presentation.ratelimit.SubidaRateLimiter;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Fija los cupos de los dos frenos tal y como están, para poder reorganizarlos sin cambiarlos. */
class RateLimitersTest {

    @Nested
    class Login {
        private final LoginRateLimiter freno = new LoginRateLimiter();

        @Test
        void fiveTriesPerIpThenStops() {
            for (int i = 0; i < 5; i++) assertTrue(freno.tryConsume("1.1.1.1"), "intento " + (i + 1));
            assertFalse(freno.tryConsume("1.1.1.1"));
            assertTrue(freno.tryConsume("2.2.2.2"), "otra IP tiene su propio cupo");
        }

        @Test
        void sixtyTriesInTotalAcrossIps() {
            for (int i = 0; i < 60; i++) assertTrue(freno.tryConsume("10.0.0." + i), "intento " + (i + 1));
            assertFalse(freno.tryConsume("10.0.1.1"), "el cupo global se acabó aunque la IP sea nueva");
        }

        @Test
        void anExhaustedIpDoesNotSpendTheGlobalQuota() {
            for (int i = 0; i < 50; i++) freno.tryConsume("1.1.1.1"); // 5 pasan, 45 frenados
            // Si los frenados gastaran del global (60), aquí quedarían 10 y no 55.
            for (int i = 0; i < 55; i++) assertTrue(freno.tryConsume("10.0.0." + i), "intento " + (i + 1));
        }
    }

    @Nested
    class Subida {
        private final SubidaRateLimiter freno = new SubidaRateLimiter();

        @Test
        void twentyPerUserThenStops() {
            for (int i = 0; i < 20; i++) assertTrue(freno.tryConsume("admin"), "subida " + (i + 1));
            assertFalse(freno.tryConsume("admin"));
            assertTrue(freno.tryConsume("otro"));
        }

        @Test
        void unknownUsersShareOneQuota() {
            for (int i = 0; i < 20; i++) assertTrue(freno.tryConsume(null));
            assertFalse(freno.tryConsume(null));
        }

        @Test
        void aFloodOfNewUsersEmptiesTheMapInsteadOfGrowing() {
            for (int i = 0; i < 20; i++) freno.tryConsume("admin");
            assertFalse(freno.tryConsume("admin"));
            // 1000 claves recientes llenan el mapa; la siguiente llamada lo vacía entero.
            for (int i = 0; i < 999; i++) freno.tryConsume("u" + i);
            assertTrue(freno.tryConsume("admin"), "tras vaciarse, el contador de admin empieza de cero");
        }
    }
}

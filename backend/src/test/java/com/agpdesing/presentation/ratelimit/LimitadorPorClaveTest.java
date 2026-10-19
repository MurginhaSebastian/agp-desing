package com.agpdesing.presentation.ratelimit;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** La limpieza por caducidad del mapa de contadores (mismo paquete: la clase no es pública). */
class LimitadorPorClaveTest {

    @Test
    void keysAreIndependent() {
        var limitador = new LimitadorPorClave(1, Duration.ofMinutes(1), Duration.ofMinutes(10), 100);
        assertTrue(limitador.tryConsume("a"));
        assertFalse(limitador.tryConsume("a"));
        assertTrue(limitador.tryConsume("b"));
    }

    @Test
    void capacityIsExact() {
        var limitador = new LimitadorPorClave(3, Duration.ofMinutes(1), Duration.ofMinutes(10), 100);
        for (int i = 0; i < 3; i++) assertTrue(limitador.tryConsume("a"), "intento " + (i + 1));
        assertFalse(limitador.tryConsume("a"));
    }

    @Test
    void whenFullOnlyTheExpiredCountersAreDropped() throws InterruptedException {
        // Tope de 3 entradas, caducidad 100 ms, un intento por clave.
        var limitador = new LimitadorPorClave(1, Duration.ofMinutes(1), Duration.ofMillis(100), 3);
        assertTrue(limitador.tryConsume("vieja"));
        Thread.sleep(250);
        assertTrue(limitador.tryConsume("r1"));
        assertTrue(limitador.tryConsume("r2"));

        // Mapa lleno (3): esta llamada limpia. «vieja» caducó y se va; «r1» se queda con su cupo gastado.
        assertFalse(limitador.tryConsume("r1"), "una clave reciente conserva su contador");
        assertTrue(limitador.tryConsume("vieja"), "una clave caducada empieza de cero");
    }
}

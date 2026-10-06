package com.agpdesing.presentation.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Un cupo por clave (una IP, un usuario…): tantos intentos por ventana de tiempo, y vuelta a
 * empezar. Lo comparten los frenos del login y de la subida de fotos, que antes eran dos copias
 * casi iguales del mismo código.
 *
 * El mapa de contadores se limpia: guardar una entrada por clave distinta sin borrarla nunca
 * dejaba hacerlo crecer sin tope con solo inventar claves. Al llegar a `maxEntradas` se tiran las
 * que llevan más de `caducidad` sin usarse; si aun así sigue lleno (alguien está inundando con
 * claves nuevas) se vacía entero, que es preferible a crecer sin límite.
 *
 * En memoria: si algún día hay varias instancias, esto se mueve a Redis.
 */
final class LimitadorPorClave {

    private final int capacidad;
    private final Duration ventana;
    private final Duration caducidad;
    private final int maxEntradas;
    private final Map<String, Contador> contadores = new ConcurrentHashMap<>();

    private final class Contador {
        final Bucket bucket = cubo(capacidad, ventana);
        volatile long ultimoUso = System.nanoTime();
    }

    LimitadorPorClave(int capacidad, Duration ventana, Duration caducidad, int maxEntradas) {
        this.capacidad = capacidad;
        this.ventana = ventana;
        this.caducidad = caducidad;
        this.maxEntradas = maxEntradas;
    }

    /** Gasta un intento de esa clave. `false` si ya no le quedaban. */
    boolean tryConsume(String clave) {
        if (contadores.size() >= maxEntradas) limpiar();
        Contador c = contadores.computeIfAbsent(clave, k -> new Contador());
        c.ultimoUso = System.nanoTime();
        return c.bucket.tryConsume(1);
    }

    private void limpiar() {
        long limite = System.nanoTime() - caducidad.toNanos();
        for (Iterator<Map.Entry<String, Contador>> it = contadores.entrySet().iterator(); it.hasNext(); ) {
            if (it.next().getValue().ultimoUso < limite) it.remove();
        }
        if (contadores.size() >= maxEntradas) contadores.clear();
    }

    /** Un cupo suelto: `capacidad` intentos por `ventana`, que se recargan poco a poco. */
    static Bucket cubo(int capacidad, Duration ventana) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(capacidad).refillGreedy(capacidad, ventana).build())
                .build();
    }
}

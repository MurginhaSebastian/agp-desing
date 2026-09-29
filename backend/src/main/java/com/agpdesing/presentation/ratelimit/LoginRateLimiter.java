package com.agpdesing.presentation.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Freno del login. Dos contadores a la vez:
 *
 * <ul>
 *   <li><b>Por IP</b>: 5 intentos por minuto. Suficiente para una sola cuenta admin.</li>
 *   <li><b>Global</b>: 60 intentos por minuto en toda la instancia. Es la red que queda cuando
 *       el atacante cambia de IP (o falsea la cabecera del proxy): sin él, repartir los intentos
 *       entre miles de IPs deja la fuerza bruta sin freno. 60/min es holgado para que el dueño
 *       pueda entrar aunque alguien esté golpeando, y a la vez deja el ataque en algo inviable
 *       contra BCrypt con coste 12.</li>
 * </ul>
 *
 * El mapa de contadores por IP se limpia: antes se guardaba una entrada por clave distinta y no
 * se borraba nunca, así que bastaba con inventar IPs para hacerlo crecer sin tope.
 * En memoria: si algún día hay varias instancias, esto se mueve a Redis.
 */
@Component
public class LoginRateLimiter {

    private static final int POR_IP = 5;
    private static final int GLOBAL = 60;
    private static final Duration VENTANA = Duration.ofMinutes(1);
    /** Una entrada sin usar más de esto se tira en la siguiente limpieza. */
    private static final Duration CADUCIDAD = Duration.ofMinutes(10);
    /** Tope duro del mapa. Al llegar aquí se limpia; si aun así no baja, se vacía entero. */
    private static final int MAX_ENTRADAS = 10_000;

    private static final class Contador {
        final Bucket bucket = nuevoBucket(POR_IP);
        volatile long ultimoUso = System.nanoTime();
    }

    private final Map<String, Contador> porIp = new ConcurrentHashMap<>();
    private final Bucket global = nuevoBucket(GLOBAL);

    public boolean tryConsume(String clientKey) {
        if (porIp.size() >= MAX_ENTRADAS) limpiar();
        Contador c = porIp.computeIfAbsent(clientKey, k -> new Contador());
        c.ultimoUso = System.nanoTime();
        // El global se consume solo si la IP tenía cupo: así un atacante con una sola IP
        // no puede agotar el contador global y dejar al dueño fuera.
        return c.bucket.tryConsume(1) && global.tryConsume(1);
    }

    private void limpiar() {
        long limite = System.nanoTime() - CADUCIDAD.toNanos();
        for (Iterator<Map.Entry<String, Contador>> it = porIp.entrySet().iterator(); it.hasNext(); ) {
            if (it.next().getValue().ultimoUso < limite) it.remove();
        }
        // Todas recientes: alguien está inundando con claves nuevas. Vaciar es preferible
        // a crecer sin límite; el contador global sigue frenando la fuerza bruta.
        if (porIp.size() >= MAX_ENTRADAS) porIp.clear();
    }

    private static Bucket nuevoBucket(int capacidad) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(capacidad).refillGreedy(capacidad, VENTANA).build())
                .build();
    }
}

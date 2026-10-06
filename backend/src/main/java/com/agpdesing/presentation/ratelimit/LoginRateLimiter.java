package com.agpdesing.presentation.ratelimit;

import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;

import java.time.Duration;

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
 * Los contadores por IP se olvidan a los 10 minutos sin uso y el mapa no pasa de 10 000 entradas
 * (ver {@link LimitadorPorClave}).
 */
@Component
public class LoginRateLimiter {

    private static final int POR_IP = 5;
    private static final int GLOBAL = 60;
    private static final Duration VENTANA = Duration.ofMinutes(1);

    private final LimitadorPorClave porIp = new LimitadorPorClave(POR_IP, VENTANA, Duration.ofMinutes(10), 10_000);
    private final Bucket global = LimitadorPorClave.cubo(GLOBAL, VENTANA);

    public boolean tryConsume(String clientKey) {
        // El global se consume solo si la IP tenía cupo: así un atacante con una sola IP
        // no puede agotar el contador global y dejar al dueño fuera.
        return porIp.tryConsume(clientKey) && global.tryConsume(1);
    }
}

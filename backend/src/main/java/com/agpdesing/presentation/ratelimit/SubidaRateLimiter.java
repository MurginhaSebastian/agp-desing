package com.agpdesing.presentation.ratelimit;

import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Freno de la subida de fotos: 20 por minuto y por usuario.
 *
 * Por qué hace falta si para subir ya hay que estar dentro del panel: una sesión abierta en un
 * ordenador prestado, o un token robado, bastan para llenar el almacén de Supabase (1 GB en el
 * plan gratuito) y para tener al servidor moviendo archivos de 5 MB. Cada subida se queda en
 * memoria mientras se procesa, y en Render hay 512 MB en total.
 *
 * 20 por minuto es mucho más de lo que nadie hace a mano —subir 20 fotos seguidas al catálogo ya
 * es un día de trabajo— y a la vez deja el abuso en algo que no vale la pena.
 *
 * Se cuenta por usuario del token, no por IP: aquí ya se sabe quién es, y es una identidad más
 * fiable que una dirección que puede cambiar o compartirse. Un contador se olvida a los 15
 * minutos sin uso y el mapa no pasa de 1000 entradas (ver {@link LimitadorPorClave}).
 */
@Component
public class SubidaRateLimiter {

    private static final int POR_MINUTO = 20;

    private final LimitadorPorClave porUsuario =
            new LimitadorPorClave(POR_MINUTO, Duration.ofMinutes(1), Duration.ofMinutes(15), 1_000);

    public boolean tryConsume(String usuario) {
        return porUsuario.tryConsume(usuario == null ? "desconocido" : usuario);
    }
}

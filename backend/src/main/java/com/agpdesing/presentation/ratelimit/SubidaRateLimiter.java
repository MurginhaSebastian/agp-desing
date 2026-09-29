package com.agpdesing.presentation.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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
 * fiable que una dirección que puede cambiar o compartirse.
 */
@Component
public class SubidaRateLimiter {

    /** Se han subido demasiadas fotos seguidas. */
    public static class DemasiadasSubidasException extends RuntimeException {
        public DemasiadasSubidasException(String message) {
            super(message);
        }
    }

    private static final int POR_MINUTO = 20;
    private static final Duration VENTANA = Duration.ofMinutes(1);
    private static final Duration CADUCIDAD = Duration.ofMinutes(15);
    private static final int MAX_ENTRADAS = 1_000;

    private static final class Contador {
        final Bucket bucket = Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(POR_MINUTO).refillGreedy(POR_MINUTO, VENTANA).build())
                .build();
        volatile long ultimoUso = System.nanoTime();
    }

    private final Map<String, Contador> porUsuario = new ConcurrentHashMap<>();

    public boolean tryConsume(String usuario) {
        if (porUsuario.size() >= MAX_ENTRADAS) limpiar();
        Contador c = porUsuario.computeIfAbsent(usuario == null ? "desconocido" : usuario, k -> new Contador());
        c.ultimoUso = System.nanoTime();
        return c.bucket.tryConsume(1);
    }

    /** Se tiran los contadores que llevan rato sin usarse, para que el mapa no crezca sin fin. */
    private void limpiar() {
        long limite = System.nanoTime() - CADUCIDAD.toNanos();
        for (Iterator<Map.Entry<String, Contador>> it = porUsuario.entrySet().iterator(); it.hasNext(); ) {
            if (it.next().getValue().ultimoUso < limite) it.remove();
        }
        if (porUsuario.size() >= MAX_ENTRADAS) porUsuario.clear();
    }
}

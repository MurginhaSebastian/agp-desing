package com.agpdesing.presentation.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 5 intentos de login por minuto por IP. Suficiente para una sola cuenta admin
 * y para frenar fuerza bruta. En memoria: si se escala a varias instancias, mover a Redis.
 */
@Component
public class LoginRateLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean tryConsume(String clientKey) {
        Bucket bucket = buckets.computeIfAbsent(clientKey, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(5).refillGreedy(5, Duration.ofMinutes(1)).build())
                .build());
        return bucket.tryConsume(1);
    }
}

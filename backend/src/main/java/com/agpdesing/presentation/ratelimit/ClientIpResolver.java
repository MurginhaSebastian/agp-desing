package com.agpdesing.presentation.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * De qué IP viene una petición, para contar intentos de login.
 *
 * `X-Forwarded-For` la escribe quien llama, no el servidor: creerse el primer valor de la lista
 * (como se hacía antes) permite inventar una IP distinta en cada intento y saltarse el freno por
 * completo. Lo único fiable es contar hops desde la derecha: el proxy de confianza añade la IP
 * que él vio, y esa va al final.
 *
 * `app.ratelimit.trusted-proxy-hops` = número de proxies propios delante:
 * 0 (por defecto, y en local) usa la IP de la conexión y la cabecera se ignora.
 * Detrás de Render o Railway hay que poner el número real de proxies, normalmente 1, y
 * confirmarlo tras desplegar (ver docs/DEPLOY.md): con 0 detrás de un proxy, todas las
 * peticiones comparten contador y un desconocido puede dejar al dueño fuera del panel.
 */
@Component
public class ClientIpResolver {

    private final int hops;

    public ClientIpResolver(@Value("${app.ratelimit.trusted-proxy-hops:0}") int hops) {
        this.hops = Math.max(0, hops);
    }

    public String resolve(HttpServletRequest request) {
        String directa = request.getRemoteAddr();
        if (hops == 0) return directa == null ? "desconocida" : directa;

        String cabecera = request.getHeader("X-Forwarded-For");
        if (cabecera == null || cabecera.isBlank()) return directa == null ? "desconocida" : directa;

        String[] partes = cabecera.split(",");
        int indice = partes.length - hops;
        // Lista más corta de lo esperado: alguien la recortó o hay menos proxies. Nos quedamos
        // con el valor más a la izquierda que sí escribió un proxy nuestro.
        if (indice < 0) indice = 0;
        String ip = partes[indice].strip();
        return ip.isEmpty() ? (directa == null ? "desconocida" : directa) : ip;
    }
}

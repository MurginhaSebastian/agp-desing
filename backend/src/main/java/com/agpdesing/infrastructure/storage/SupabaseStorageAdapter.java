package com.agpdesing.infrastructure.storage;

import com.agpdesing.application.port.out.ImageStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Guarda la imagen en Supabase Storage con el cliente HTTP del propio Java: no hace falta
 * ninguna librería añadida.
 *
 * Dos direcciones, comprobadas contra el proyecto real:
 *   subir   POST {url}/storage/v1/object/{bucket}/{nombre}
 *   ver     GET  {url}/storage/v1/object/public/{bucket}/{nombre}   (bucket público)
 *
 * La clave secreta va en las cabeceras. Nunca se escriben las cabeceras en el log: un log con
 * esa clave es una clave filtrada.
 */
@Component
public class SupabaseStorageAdapter implements ImageStorage {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorageAdapter.class);

    private final SupabaseStorageProperties props;
    private final HttpClient http;

    public SupabaseStorageAdapter(SupabaseStorageProperties props) {
        this.props = props;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    @Override
    public String guardar(String nombre, String tipoMime, byte[] contenido) {
        if (!props.configurado()) {
            throw new NotConfiguredException(
                    "Subir fotos todavía no está configurado: faltan SUPABASE_URL, SUPABASE_SERVICE_KEY o SUPABASE_BUCKET.");
        }

        String destino = props.urlBase() + "/storage/v1/object/" + props.bucket() + "/" + nombre;
        HttpRequest peticion = HttpRequest.newBuilder(URI.create(destino))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + props.key())
                .header("apikey", props.key())
                .header("Content-Type", tipoMime)
                .header("Cache-Control", "public, max-age=31536000, immutable") // el nombre es único: nunca cambia
                .header("x-upsert", "false")                                    // el nombre es un UUID: no debería existir
                .POST(HttpRequest.BodyPublishers.ofByteArray(contenido))
                .build();

        HttpResponse<String> respuesta;
        try {
            respuesta = http.send(peticion, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new StorageFailedException("Se interrumpió la subida de la foto.", e);
        } catch (Exception e) {
            throw new StorageFailedException("No se pudo conectar con el almacenamiento de fotos.", e);
        }

        if (respuesta.statusCode() / 100 != 2) {
            // Se registra el cuerpo (dice, por ejemplo, «Bucket not found»), nunca las cabeceras.
            log.error("Supabase Storage rechazó la subida: HTTP {} — {}", respuesta.statusCode(), recortar(respuesta.body()));
            throw new StorageFailedException(mensajeSegunRespuesta(respuesta.statusCode(), respuesta.body()), null);
        }

        return props.urlBase() + "/storage/v1/object/public/" + props.bucket() + "/" + nombre;
    }

    /** Traduce los fallos habituales a algo que se pueda arreglar sin abrir el log. */
    private static String mensajeSegunRespuesta(int codigo, String cuerpo) {
        String texto = cuerpo == null ? "" : cuerpo;
        if (texto.contains("Bucket not found")) {
            return "El almacén de fotos no existe todavía: crea el bucket en Supabase → Storage y márcalo como público.";
        }
        if (codigo == 401 || codigo == 403) {
            return "El almacenamiento rechazó la clave. Revisa SUPABASE_SERVICE_KEY.";
        }
        if (texto.contains("exceeded the maximum allowed size") || codigo == 413) {
            return "La foto supera el límite que tiene puesto el bucket en Supabase.";
        }
        if (texto.contains("mime type") || texto.contains("not supported")) {
            return "El bucket de Supabase no admite ese tipo de archivo. Revisa los formatos permitidos en sus ajustes.";
        }
        return "El almacenamiento de fotos falló. Inténtalo de nuevo en un momento.";
    }

    private static String recortar(String s) {
        if (s == null) return "";
        return s.length() > 300 ? s.substring(0, 300) + "…" : s;
    }
}

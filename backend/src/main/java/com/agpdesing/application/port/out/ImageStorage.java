package com.agpdesing.application.port.out;

/**
 * Puerto de salida: guardar una imagen en algún sitio y devolver su dirección pública.
 * Hoy lo implementa Supabase Storage; el núcleo no sabe cuál es.
 */
public interface ImageStorage {

    /** Se lanza cuando el almacenamiento no está configurado (falta URL o clave). */
    class NotConfiguredException extends RuntimeException {
        public NotConfiguredException(String message) {
            super(message);
        }
    }

    /** Se lanza cuando el almacenamiento responde mal o no responde. */
    class StorageFailedException extends RuntimeException {
        public StorageFailedException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /**
     * @param nombre   nombre final del archivo, ya sin nada del original
     * @param tipoMime tipo real del archivo, detectado por sus bytes
     * @return dirección pública para poner en un <img src="…">
     */
    String guardar(String nombre, String tipoMime, byte[] contenido);
}

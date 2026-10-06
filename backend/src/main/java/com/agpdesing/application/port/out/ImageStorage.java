package com.agpdesing.application.port.out;

/**
 * Puerto de salida: guardar una imagen en algún sitio y devolver su dirección pública.
 * Hoy lo implementa Supabase Storage; el núcleo no sabe cuál es.
 */
public interface ImageStorage {

    /**
     * @param nombre   nombre final del archivo, ya sin nada del original
     * @param tipoMime tipo real del archivo, detectado por sus bytes
     * @return dirección pública para poner en un <img src="…">
     * @throws com.agpdesing.application.exception.StorageNotConfiguredException si falta configurarlo
     * @throws com.agpdesing.application.exception.StorageFailedException si responde mal o no responde
     */
    String guardar(String nombre, String tipoMime, byte[] contenido);
}

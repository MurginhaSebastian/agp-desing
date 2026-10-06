package com.agpdesing.application.port.out;

import java.util.function.Supplier;

/**
 * Puerto de salida (Unit of Work): hacer varias cosas con la base de datos como si fueran una.
 * O salen todas o no sale ninguna, y nadie se cuela entre medias.
 *
 * Hace falta en las altas y ediciones: comprobar que el nombre no está repetido y guardar, si van
 * por separado, dejan un hueco por el que otra alta con el mismo nombre se cuela. La implementación
 * con Spring vive en infraestructura; el caso de uso no sabe de Spring.
 */
public interface Transacciones {

    /** Ejecuta `trabajo` dentro de una transacción y devuelve lo que devuelva. Si lanza, se deshace todo. */
    <T> T enTransaccion(Supplier<T> trabajo);

    default void enTransaccion(Runnable trabajo) {
        enTransaccion(() -> {
            trabajo.run();
            return null;
        });
    }
}

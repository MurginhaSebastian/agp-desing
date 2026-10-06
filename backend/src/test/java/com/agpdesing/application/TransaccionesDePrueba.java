package com.agpdesing.application;

import com.agpdesing.application.port.out.Transacciones;

import java.util.function.Supplier;

/** Ejecuta el trabajo sin base de datos y apunta si se está dentro de una transacción. */
public final class TransaccionesDePrueba implements Transacciones {

    public int abiertas;
    public boolean dentro;

    @Override
    public <T> T enTransaccion(Supplier<T> trabajo) {
        abiertas++;
        boolean antes = dentro;
        dentro = true;
        try {
            return trabajo.get();
        } finally {
            dentro = antes;
        }
    }
}

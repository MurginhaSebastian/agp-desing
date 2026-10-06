package com.agpdesing.infrastructure.persistence;

import com.agpdesing.application.port.out.Transacciones;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.function.Supplier;

/**
 * Adaptador del puerto {@link Transacciones} con las transacciones de Spring. Los `@Transactional`
 * de los repositorios se suman a esta (propagación REQUIRED), así que todo va en una sola.
 */
@Component
public class SpringTransacciones implements Transacciones {

    private final TransactionTemplate plantilla;

    public SpringTransacciones(PlatformTransactionManager gestor) {
        this.plantilla = new TransactionTemplate(gestor);
    }

    @Override
    public <T> T enTransaccion(Supplier<T> trabajo) {
        return plantilla.execute(estado -> trabajo.get());
    }
}

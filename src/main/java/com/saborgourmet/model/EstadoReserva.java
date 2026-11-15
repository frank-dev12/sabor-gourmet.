package com.saborgourmet.model;

public enum EstadoReserva {
    CONFIRMADA,
    COMPLETADA,
    CANCELADA;

    public boolean esFinal() {
        return this != CONFIRMADA;
    }
}

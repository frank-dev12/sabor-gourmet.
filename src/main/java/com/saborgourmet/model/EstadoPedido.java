package com.saborgourmet.model;

public enum EstadoPedido {
    PENDIENTE,
    EN_PREPARACION,
    LISTO,
    ENTREGADO,
    CANCELADO;

    public boolean esFinal() {
        return this == ENTREGADO || this == CANCELADO;
    }
}

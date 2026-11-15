package com.saborgourmet.dto;

import jakarta.validation.constraints.NotNull;

/** Cantidad positiva para reabastecer, negativa para mermas o correcciones de inventario. */
public record AjusteStockRequest(@NotNull Integer cantidad) {
}

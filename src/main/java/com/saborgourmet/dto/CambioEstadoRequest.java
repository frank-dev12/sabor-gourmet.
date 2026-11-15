package com.saborgourmet.dto;

import com.saborgourmet.model.EstadoPedido;
import jakarta.validation.constraints.NotNull;

public record CambioEstadoRequest(@NotNull EstadoPedido estado) {
}

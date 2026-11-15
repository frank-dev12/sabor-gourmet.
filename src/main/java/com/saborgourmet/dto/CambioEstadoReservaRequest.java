package com.saborgourmet.dto;

import com.saborgourmet.model.EstadoReserva;
import jakarta.validation.constraints.NotNull;

public record CambioEstadoReservaRequest(@NotNull EstadoReserva estado) {
}

package com.saborgourmet.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record ReservaRequest(
        @NotNull Long mesaId,
        @NotBlank @Size(max = 120) String nombreCliente,
        @Size(max = 30) String telefono,
        @NotNull @Positive Integer numeroPersonas,
        @NotNull @Future LocalDateTime fechaHoraInicio,
        @NotNull LocalDateTime fechaHoraFin,
        @Size(max = 500) String observaciones) {

    @AssertTrue(message = "fechaHoraFin debe ser posterior a fechaHoraInicio")
    public boolean isRangoValido() {
        return fechaHoraInicio == null || fechaHoraFin == null || fechaHoraFin.isAfter(fechaHoraInicio);
    }
}

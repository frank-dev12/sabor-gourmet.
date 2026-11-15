package com.saborgourmet.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record MesaRequest(
        @NotNull @Positive Integer numero,
        @NotNull @Positive @Max(50) Integer capacidad,
        @Size(max = 60) String ubicacion) {
}

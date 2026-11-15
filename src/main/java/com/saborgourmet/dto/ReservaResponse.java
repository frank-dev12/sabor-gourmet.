package com.saborgourmet.dto;

import com.saborgourmet.model.EstadoReserva;
import com.saborgourmet.model.Reserva;
import java.time.LocalDateTime;

public record ReservaResponse(
        Long id,
        Long mesaId,
        Integer numeroMesa,
        String nombreCliente,
        String telefono,
        Integer numeroPersonas,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        EstadoReserva estado,
        String observaciones,
        LocalDateTime fechaCreacion) {

    public static ReservaResponse desde(Reserva r) {
        return new ReservaResponse(
                r.getId(),
                r.getMesa().getId(),
                r.getMesa().getNumero(),
                r.getNombreCliente(),
                r.getTelefono(),
                r.getNumeroPersonas(),
                r.getFechaHoraInicio(),
                r.getFechaHoraFin(),
                r.getEstado(),
                r.getObservaciones(),
                r.getFechaCreacion());
    }
}

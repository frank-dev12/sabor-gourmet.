package com.saborgourmet.service;

import com.saborgourmet.dto.ReservaRequest;
import com.saborgourmet.dto.ReservaResponse;
import com.saborgourmet.model.EstadoReserva;
import java.time.LocalDate;
import java.util.List;

public interface ReservaService {

    List<ReservaResponse> listar(Long mesaId, LocalDate fecha);

    ReservaResponse obtener(Long id);

    ReservaResponse crear(ReservaRequest request);

    ReservaResponse actualizar(Long id, ReservaRequest request);

    ReservaResponse cambiarEstado(Long id, EstadoReserva nuevoEstado);
}

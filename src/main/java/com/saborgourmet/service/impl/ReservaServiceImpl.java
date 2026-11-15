package com.saborgourmet.service.impl;

import com.saborgourmet.dto.ReservaRequest;
import com.saborgourmet.dto.ReservaResponse;
import com.saborgourmet.exception.RecursoNoEncontradoException;
import com.saborgourmet.exception.ReglaNegocioException;
import com.saborgourmet.model.EstadoReserva;
import com.saborgourmet.model.Mesa;
import com.saborgourmet.model.Reserva;
import com.saborgourmet.repository.MesaRepository;
import com.saborgourmet.repository.ReservaRepository;
import com.saborgourmet.service.ReservaService;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReservaServiceImpl implements ReservaService {

    private static final DateTimeFormatter FORMATO = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ReservaRepository reservaRepository;
    private final MesaRepository mesaRepository;

    public ReservaServiceImpl(ReservaRepository reservaRepository, MesaRepository mesaRepository) {
        this.reservaRepository = reservaRepository;
        this.mesaRepository = mesaRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservaResponse> listar(Long mesaId, LocalDate fecha) {
        LocalDate dia = (fecha != null) ? fecha : LocalDate.now();
        return reservaRepository.buscar(mesaId, dia.atStartOfDay(), dia.plusDays(1).atStartOfDay()).stream()
                .map(ReservaResponse::desde)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReservaResponse obtener(Long id) {
        return ReservaResponse.desde(buscar(id));
    }

    @Override
    public ReservaResponse crear(ReservaRequest request) {
        Mesa mesa = bloquearMesaReservable(request);
        validarSinCruces(mesa, request, null);

        Reserva reserva = new Reserva();
        aplicar(reserva, mesa, request);
        return ReservaResponse.desde(reservaRepository.save(reserva));
    }

    @Override
    public ReservaResponse actualizar(Long id, ReservaRequest request) {
        Reserva reserva = buscar(id);
        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw new ReglaNegocioException("Solo se pueden modificar reservas CONFIRMADAS (estado actual: "
                    + reserva.getEstado() + ")");
        }
        Mesa mesa = bloquearMesaReservable(request);
        validarSinCruces(mesa, request, reserva.getId());

        aplicar(reserva, mesa, request);
        return ReservaResponse.desde(reserva);
    }

    @Override
    public ReservaResponse cambiarEstado(Long id, EstadoReserva nuevoEstado) {
        Reserva reserva = buscar(id);
        if (reserva.getEstado().esFinal()) {
            throw new ReglaNegocioException("La reserva ya está " + reserva.getEstado()
                    + " y no admite cambios de estado");
        }
        reserva.setEstado(nuevoEstado);
        return ReservaResponse.desde(reserva);
    }

    private Reserva buscar(Long id) {
        return reservaRepository.findConMesaById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la reserva con id " + id));
    }

    private Mesa bloquearMesaReservable(ReservaRequest request) {
        Mesa mesa = mesaRepository.findByIdParaActualizar(request.mesaId())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la mesa con id " + request.mesaId()));
        if (!mesa.isActiva()) {
            throw new ReglaNegocioException("La mesa " + mesa.getNumero() + " no está activa");
        }
        if (request.numeroPersonas() > mesa.getCapacidad()) {
            throw new ReglaNegocioException("La mesa " + mesa.getNumero() + " tiene capacidad para "
                    + mesa.getCapacidad() + " personas (solicitadas: " + request.numeroPersonas() + ")");
        }
        return mesa;
    }

    private void validarSinCruces(Mesa mesa, ReservaRequest request, Long reservaExcluida) {
        List<Reserva> cruces = reservaRepository.buscarCruces(
                mesa.getId(), request.fechaHoraInicio(), request.fechaHoraFin(),
                EstadoReserva.CONFIRMADA, reservaExcluida);
        if (!cruces.isEmpty()) {
            String horarios = cruces.stream()
                    .map(r -> FORMATO.format(r.getFechaHoraInicio()) + " a " + FORMATO.format(r.getFechaHoraFin()))
                    .collect(Collectors.joining(", "));
            throw new ReglaNegocioException("La mesa " + mesa.getNumero()
                    + " ya está reservada en ese horario: " + horarios);
        }
    }

    private static void aplicar(Reserva reserva, Mesa mesa, ReservaRequest request) {
        reserva.setMesa(mesa);
        reserva.setNombreCliente(request.nombreCliente().trim());
        reserva.setTelefono(request.telefono());
        reserva.setNumeroPersonas(request.numeroPersonas());
        reserva.setFechaHoraInicio(request.fechaHoraInicio());
        reserva.setFechaHoraFin(request.fechaHoraFin());
        reserva.setObservaciones(request.observaciones());
    }
}

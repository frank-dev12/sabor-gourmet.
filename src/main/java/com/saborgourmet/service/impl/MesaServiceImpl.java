package com.saborgourmet.service.impl;

import com.saborgourmet.dto.MesaRequest;
import com.saborgourmet.dto.MesaResponse;
import com.saborgourmet.exception.RecursoNoEncontradoException;
import com.saborgourmet.exception.ReglaNegocioException;
import com.saborgourmet.exception.SolicitudInvalidaException;
import com.saborgourmet.model.EstadoReserva;
import com.saborgourmet.model.Mesa;
import com.saborgourmet.repository.MesaRepository;
import com.saborgourmet.repository.ReservaRepository;
import com.saborgourmet.service.MesaService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MesaServiceImpl implements MesaService {

    private final MesaRepository mesaRepository;
    private final ReservaRepository reservaRepository;

    public MesaServiceImpl(MesaRepository mesaRepository, ReservaRepository reservaRepository) {
        this.mesaRepository = mesaRepository;
        this.reservaRepository = reservaRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MesaResponse> listar(boolean soloActivas) {
        List<Mesa> mesas = soloActivas
                ? mesaRepository.findByActivaTrueOrderByNumero()
                : mesaRepository.findAllByOrderByNumero();
        return mesas.stream().map(MesaResponse::desde).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MesaResponse> disponibles(LocalDateTime inicio, LocalDateTime fin, int personas) {
        if (!fin.isAfter(inicio)) {
            throw new SolicitudInvalidaException("fin debe ser posterior a inicio");
        }
        return mesaRepository.buscarDisponibles(inicio, fin, personas, EstadoReserva.CONFIRMADA).stream()
                .map(MesaResponse::desde)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MesaResponse obtener(Long id) {
        return MesaResponse.desde(buscar(id));
    }

    @Override
    public MesaResponse crear(MesaRequest request) {
        if (mesaRepository.existsByNumero(request.numero())) {
            throw new ReglaNegocioException("Ya existe la mesa número " + request.numero());
        }
        Mesa mesa = new Mesa();
        aplicar(mesa, request);
        return MesaResponse.desde(mesaRepository.save(mesa));
    }

    @Override
    public MesaResponse actualizar(Long id, MesaRequest request) {
        Mesa mesa = buscar(id);
        if (mesaRepository.existsByNumeroAndIdNot(request.numero(), id)) {
            throw new ReglaNegocioException("Ya existe otra mesa con el número " + request.numero());
        }
        aplicar(mesa, request);
        return MesaResponse.desde(mesa);
    }

    @Override
    public void desactivar(Long id) {
        Mesa mesa = mesaRepository.findByIdParaActualizar(id)
                .orElseThrow(() -> noEncontrada(id));
        if (reservaRepository.existsByMesaIdAndEstadoAndFechaHoraFinAfter(
                id, EstadoReserva.CONFIRMADA, LocalDateTime.now())) {
            throw new ReglaNegocioException(
                    "La mesa " + mesa.getNumero() + " tiene reservas confirmadas pendientes; cancélalas primero");
        }
        mesa.setActiva(false);
    }

    private Mesa buscar(Long id) {
        return mesaRepository.findById(id).orElseThrow(() -> noEncontrada(id));
    }

    private static RecursoNoEncontradoException noEncontrada(Long id) {
        return new RecursoNoEncontradoException("No existe la mesa con id " + id);
    }

    private static void aplicar(Mesa mesa, MesaRequest request) {
        mesa.setNumero(request.numero());
        mesa.setCapacidad(request.capacidad());
        mesa.setUbicacion(request.ubicacion());
    }
}

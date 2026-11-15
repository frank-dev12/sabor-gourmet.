package com.saborgourmet.service;

import com.saborgourmet.dto.MesaRequest;
import com.saborgourmet.dto.MesaResponse;
import java.time.LocalDateTime;
import java.util.List;

public interface MesaService {

    List<MesaResponse> listar(boolean soloActivas);

    List<MesaResponse> disponibles(LocalDateTime inicio, LocalDateTime fin, int personas);

    MesaResponse obtener(Long id);

    MesaResponse crear(MesaRequest request);

    MesaResponse actualizar(Long id, MesaRequest request);

    void desactivar(Long id);
}

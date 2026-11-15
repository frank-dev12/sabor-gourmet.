package com.saborgourmet.service;

import com.saborgourmet.dto.PedidoRequest;
import com.saborgourmet.dto.PedidoResponse;
import com.saborgourmet.model.EstadoPedido;
import java.util.List;

public interface PedidoService {

    List<PedidoResponse> listar(EstadoPedido estado);

    PedidoResponse obtener(Long id);

    PedidoResponse crear(PedidoRequest request);

    PedidoResponse actualizar(Long id, PedidoRequest request);

    PedidoResponse cambiarEstado(Long id, EstadoPedido nuevoEstado);

    void eliminar(Long id);
}

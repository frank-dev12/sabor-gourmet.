package com.saborgourmet.service.impl;

import com.saborgourmet.dto.PedidoRequest;
import com.saborgourmet.dto.PedidoResponse;
import com.saborgourmet.exception.RecursoNoEncontradoException;
import com.saborgourmet.exception.ReglaNegocioException;
import com.saborgourmet.model.DetallePedido;
import com.saborgourmet.model.EstadoPedido;
import com.saborgourmet.model.Pedido;
import com.saborgourmet.model.Producto;
import com.saborgourmet.model.TipoPedido;
import com.saborgourmet.repository.PedidoRepository;
import com.saborgourmet.repository.ProductoRepository;
import com.saborgourmet.service.PedidoService;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    public PedidoServiceImpl(PedidoRepository pedidoRepository, ProductoRepository productoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidoResponse> listar(EstadoPedido estado) {
        List<Pedido> pedidos = (estado == null)
                ? pedidoRepository.findAllByOrderByFechaCreacionDesc()
                : pedidoRepository.findByEstadoOrderByFechaCreacionDesc(estado);
        return pedidos.stream().map(PedidoResponse::desde).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PedidoResponse obtener(Long id) {
        return PedidoResponse.desde(buscar(id));
    }

    @Override
    public PedidoResponse crear(PedidoRequest request) {
        Pedido pedido = new Pedido();
        aplicarDatos(pedido, request);

        Map<Long, Integer> cantidades = agruparPorProducto(request.items());
        Map<Long, Producto> productos = bloquearProductos(cantidades.keySet());
        agregarDetallesDescontandoStock(pedido, cantidades, productos);

        return PedidoResponse.desde(pedidoRepository.save(pedido));
    }

    @Override
    public PedidoResponse actualizar(Long id, PedidoRequest request) {
        Pedido pedido = buscar(id);
        if (pedido.getEstado() != EstadoPedido.PENDIENTE) {
            throw new ReglaNegocioException(
                    "Solo se pueden modificar pedidos en estado PENDIENTE (estado actual: " + pedido.getEstado() + ")");
        }
        aplicarDatos(pedido, request);

        Map<Long, Integer> cantidades = agruparPorProducto(request.items());
        Set<Long> involucrados = new HashSet<>(cantidades.keySet());
        pedido.getDetalles().forEach(d -> involucrados.add(d.getProducto().getId()));
        Map<Long, Producto> productos = bloquearProductos(involucrados);

        reponerStock(pedido, productos);
        pedido.limpiarDetalles();
        agregarDetallesDescontandoStock(pedido, cantidades, productos);

        return PedidoResponse.desde(pedidoRepository.saveAndFlush(pedido));
    }

    @Override
    public PedidoResponse cambiarEstado(Long id, EstadoPedido nuevoEstado) {
        Pedido pedido = buscar(id);
        if (pedido.getEstado().esFinal()) {
            throw new ReglaNegocioException(
                    "El pedido ya está " + pedido.getEstado() + " y no admite cambios de estado");
        }
        if (nuevoEstado == EstadoPedido.CANCELADO) {
            reponerStock(pedido, bloquearProductosDe(pedido));
        }
        pedido.setEstado(nuevoEstado);
        return PedidoResponse.desde(pedidoRepository.saveAndFlush(pedido));
    }

    @Override
    public void eliminar(Long id) {
        Pedido pedido = buscar(id);
        switch (pedido.getEstado()) {
            case PENDIENTE -> reponerStock(pedido, bloquearProductosDe(pedido));
            case CANCELADO -> { /* el stock ya se repuso al cancelar */ }
            default -> throw new ReglaNegocioException(
                    "Solo se pueden eliminar pedidos PENDIENTES o CANCELADOS; cancélalo primero");
        }
        pedidoRepository.delete(pedido);
    }

    private Pedido buscar(Long id) {
        return pedidoRepository.findWithDetallesById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el pedido con id " + id));
    }

    private static void aplicarDatos(Pedido pedido, PedidoRequest request) {
        if (request.tipo() == TipoPedido.EN_MESA && request.numeroMesa() == null) {
            throw new ReglaNegocioException("Los pedidos EN_MESA requieren numeroMesa");
        }
        String direccion = request.direccionEntrega() == null ? null : request.direccionEntrega().trim();
        if (request.tipo() == TipoPedido.DOMICILIO) {
            if (direccion == null || direccion.isEmpty()) {
                throw new ReglaNegocioException("Los pedidos a DOMICILIO requieren direccionEntrega");
            }
            if (request.metodoPago() == null) {
                throw new ReglaNegocioException("Los pedidos a DOMICILIO requieren metodoPago");
            }
        }
        pedido.setNombreCliente(request.nombreCliente().trim());
        pedido.setTipo(request.tipo());
        pedido.setNumeroMesa(request.tipo() == TipoPedido.EN_MESA ? request.numeroMesa() : null);
        pedido.setDireccionEntrega(request.tipo() == TipoPedido.DOMICILIO ? direccion : null);
        pedido.setMetodoPago(request.tipo() == TipoPedido.DOMICILIO ? request.metodoPago() : null);
        pedido.setObservaciones(request.observaciones());
    }

    /** Une líneas repetidas del mismo producto para validar el stock sobre la cantidad total pedida. */
    private static Map<Long, Integer> agruparPorProducto(List<PedidoRequest.Item> items) {
        return items.stream().collect(Collectors.toMap(
                PedidoRequest.Item::productoId,
                PedidoRequest.Item::cantidad,
                Integer::sum,
                LinkedHashMap::new));
    }

    private Map<Long, Producto> bloquearProductos(Set<Long> ids) {
        Map<Long, Producto> productos = productoRepository.findAllByIdParaActualizar(ids).stream()
                .collect(Collectors.toMap(Producto::getId, Function.identity()));
        List<Long> inexistentes = ids.stream().filter(id -> !productos.containsKey(id)).sorted().toList();
        if (!inexistentes.isEmpty()) {
            throw new RecursoNoEncontradoException("No existen productos con id " + inexistentes);
        }
        return productos;
    }

    private Map<Long, Producto> bloquearProductosDe(Pedido pedido) {
        Set<Long> ids = pedido.getDetalles().stream()
                .map(d -> d.getProducto().getId())
                .collect(Collectors.toSet());
        return bloquearProductos(ids);
    }

    private static void reponerStock(Pedido pedido, Map<Long, Producto> productos) {
        pedido.getDetalles().forEach(d -> productos.get(d.getProducto().getId()).reponerStock(d.getCantidad()));
    }

    private static void agregarDetallesDescontandoStock(
            Pedido pedido, Map<Long, Integer> cantidades, Map<Long, Producto> productos) {

        List<String> problemas = new ArrayList<>();
        cantidades.forEach((productoId, cantidad) -> {
            Producto producto = productos.get(productoId);
            if (!producto.isActivo()) {
                problemas.add("'" + producto.getNombre() + "' no está disponible");
            } else if (producto.getStock() < cantidad) {
                problemas.add("'" + producto.getNombre() + "': solicitado " + cantidad
                        + ", disponible " + producto.getStock());
            }
        });
        if (!problemas.isEmpty()) {
            throw new ReglaNegocioException("Stock insuficiente: " + String.join("; ", problemas));
        }

        cantidades.forEach((productoId, cantidad) -> {
            Producto producto = productos.get(productoId);
            producto.descontarStock(cantidad);
            pedido.agregarDetalle(new DetallePedido(producto, cantidad));
        });
    }
}

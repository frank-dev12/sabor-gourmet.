package com.saborgourmet.dto;

import com.saborgourmet.model.DetallePedido;
import com.saborgourmet.model.EstadoPedido;
import com.saborgourmet.model.MetodoPago;
import com.saborgourmet.model.Pedido;
import com.saborgourmet.model.TipoPedido;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
        Long id,
        String nombreCliente,
        TipoPedido tipo,
        Integer numeroMesa,
        String direccionEntrega,
        MetodoPago metodoPago,
        EstadoPedido estado,
        String observaciones,
        List<Item> items,
        BigDecimal total,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion) {

    public record Item(
            Long id,
            Long productoId,
            String nombreProducto,
            Integer cantidad,
            BigDecimal precioUnitario,
            BigDecimal subtotal) {

        static Item desde(DetallePedido d) {
            return new Item(
                    d.getId(),
                    d.getProducto().getId(),
                    d.getProducto().getNombre(),
                    d.getCantidad(),
                    d.getPrecioUnitario(),
                    d.getSubtotal());
        }
    }

    public static PedidoResponse desde(Pedido p) {
        return new PedidoResponse(
                p.getId(),
                p.getNombreCliente(),
                p.getTipo(),
                p.getNumeroMesa(),
                p.getDireccionEntrega(),
                p.getMetodoPago(),
                p.getEstado(),
                p.getObservaciones(),
                p.getDetalles().stream().map(Item::desde).toList(),
                p.getTotal(),
                p.getFechaCreacion(),
                p.getFechaActualizacion());
    }
}

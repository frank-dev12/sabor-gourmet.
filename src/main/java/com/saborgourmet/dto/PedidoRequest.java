package com.saborgourmet.dto;

import com.saborgourmet.model.MetodoPago;
import com.saborgourmet.model.TipoPedido;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PedidoRequest(
        @NotBlank @Size(max = 120) String nombreCliente,
        @NotNull TipoPedido tipo,
        @Positive Integer numeroMesa,
        @Size(max = 250) String direccionEntrega,
        MetodoPago metodoPago,
        @Size(max = 500) String observaciones,
        @NotEmpty List<@Valid @NotNull Item> items) {

    /** El precio no viene del cliente: se toma del Producto al registrar el pedido. */
    public record Item(
            @NotNull Long productoId,
            @NotNull @Positive Integer cantidad) {
    }
}

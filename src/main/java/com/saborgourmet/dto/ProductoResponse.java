package com.saborgourmet.dto;

import com.saborgourmet.model.CategoriaProducto;
import com.saborgourmet.model.Producto;
import java.math.BigDecimal;

public record ProductoResponse(
        Long id,
        String nombre,
        String descripcion,
        CategoriaProducto categoria,
        BigDecimal precio,
        Integer stock,
        boolean activo) {

    public static ProductoResponse desde(Producto p) {
        return new ProductoResponse(
                p.getId(), p.getNombre(), p.getDescripcion(), p.getCategoria(), p.getPrecio(), p.getStock(), p.isActivo());
    }
}

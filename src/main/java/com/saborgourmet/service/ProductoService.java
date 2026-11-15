package com.saborgourmet.service;

import com.saborgourmet.dto.ProductoRequest;
import com.saborgourmet.dto.ProductoResponse;
import com.saborgourmet.model.CategoriaProducto;
import java.util.List;

public interface ProductoService {

    List<ProductoResponse> listar(CategoriaProducto categoria, boolean soloDisponibles);

    ProductoResponse obtener(Long id);

    ProductoResponse crear(ProductoRequest request);

    ProductoResponse actualizar(Long id, ProductoRequest request);

    ProductoResponse ajustarStock(Long id, int cantidad);

    void desactivar(Long id);
}

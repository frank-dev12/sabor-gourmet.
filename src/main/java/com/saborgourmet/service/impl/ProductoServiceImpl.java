package com.saborgourmet.service.impl;

import com.saborgourmet.dto.ProductoRequest;
import com.saborgourmet.dto.ProductoResponse;
import com.saborgourmet.exception.RecursoNoEncontradoException;
import com.saborgourmet.exception.ReglaNegocioException;
import com.saborgourmet.model.CategoriaProducto;
import com.saborgourmet.model.Producto;
import com.saborgourmet.repository.ProductoRepository;
import com.saborgourmet.service.ProductoService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoServiceImpl(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(CategoriaProducto categoria, boolean soloDisponibles) {
        return productoRepository.buscar(categoria, soloDisponibles).stream()
                .map(ProductoResponse::desde)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse obtener(Long id) {
        return ProductoResponse.desde(buscar(id));
    }

    @Override
    public ProductoResponse crear(ProductoRequest request) {
        if (productoRepository.existsByNombreIgnoreCase(request.nombre())) {
            throw new ReglaNegocioException("Ya existe un producto llamado '" + request.nombre() + "'");
        }
        Producto producto = new Producto();
        aplicar(producto, request);
        return ProductoResponse.desde(productoRepository.save(producto));
    }

    @Override
    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = productoRepository.findByIdParaActualizar(id)
                .orElseThrow(() -> noEncontrado(id));
        if (productoRepository.existsByNombreIgnoreCaseAndIdNot(request.nombre(), id)) {
            throw new ReglaNegocioException("Ya existe otro producto llamado '" + request.nombre() + "'");
        }
        aplicar(producto, request);
        return ProductoResponse.desde(producto);
    }

    @Override
    public ProductoResponse ajustarStock(Long id, int cantidad) {
        Producto producto = productoRepository.findByIdParaActualizar(id)
                .orElseThrow(() -> noEncontrado(id));
        int nuevoStock = producto.getStock() + cantidad;
        if (nuevoStock < 0) {
            throw new ReglaNegocioException("El ajuste dejaría el stock de '" + producto.getNombre()
                    + "' en negativo (actual: " + producto.getStock() + ")");
        }
        producto.setStock(nuevoStock);
        return ProductoResponse.desde(producto);
    }

    @Override
    public void desactivar(Long id) {
        buscar(id).setActivo(false);
    }

    private Producto buscar(Long id) {
        return productoRepository.findById(id).orElseThrow(() -> noEncontrado(id));
    }

    private static RecursoNoEncontradoException noEncontrado(Long id) {
        return new RecursoNoEncontradoException("No existe el producto con id " + id);
    }

    private static void aplicar(Producto producto, ProductoRequest request) {
        producto.setNombre(request.nombre().trim());
        producto.setDescripcion(request.descripcion());
        producto.setCategoria(request.categoria());
        producto.setPrecio(request.precio());
        producto.setStock(request.stock());
    }
}

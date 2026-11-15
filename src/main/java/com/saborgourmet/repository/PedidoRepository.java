package com.saborgourmet.repository;

import com.saborgourmet.model.EstadoPedido;
import com.saborgourmet.model.Pedido;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @EntityGraph(attributePaths = {"detalles", "detalles.producto"})
    List<Pedido> findAllByOrderByFechaCreacionDesc();

    @EntityGraph(attributePaths = {"detalles", "detalles.producto"})
    List<Pedido> findByEstadoOrderByFechaCreacionDesc(EstadoPedido estado);

    @EntityGraph(attributePaths = "detalles")
    Optional<Pedido> findWithDetallesById(Long id);
}

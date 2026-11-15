package com.saborgourmet.repository;

import com.saborgourmet.model.CategoriaProducto;
import com.saborgourmet.model.Producto;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Query("""
            select p from Producto p
            where (:categoria is null or p.categoria = :categoria)
              and (:soloDisponibles = false or (p.activo = true and p.stock > 0))
            order by p.nombre""")
    List<Producto> buscar(@Param("categoria") CategoriaProducto categoria,
                          @Param("soloDisponibles") boolean soloDisponibles);

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    /** Ordenado por id para que transacciones concurrentes bloqueen las filas en el mismo orden (evita deadlocks). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Producto p where p.id in :ids order by p.id")
    List<Producto> findAllByIdParaActualizar(@Param("ids") Collection<Long> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Producto p where p.id = :id")
    Optional<Producto> findByIdParaActualizar(@Param("id") Long id);
}

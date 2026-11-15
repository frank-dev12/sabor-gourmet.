package com.saborgourmet.repository;

import com.saborgourmet.model.EstadoReserva;
import com.saborgourmet.model.Mesa;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MesaRepository extends JpaRepository<Mesa, Long> {

    List<Mesa> findAllByOrderByNumero();

    List<Mesa> findByActivaTrueOrderByNumero();

    boolean existsByNumero(Integer numero);

    boolean existsByNumeroAndIdNot(Integer numero, Long id);

    /** Serializa las reservas de una misma mesa para que la validación de cruces no tenga condiciones de carrera. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Mesa m where m.id = :id")
    Optional<Mesa> findByIdParaActualizar(@Param("id") Long id);

    @Query("""
            select m from Mesa m
            where m.activa = true
              and m.capacidad >= :personas
              and not exists (
                  select 1 from Reserva r
                  where r.mesa = m
                    and r.estado = :estado
                    and r.fechaHoraInicio < :fin
                    and r.fechaHoraFin > :inicio)
            order by m.capacidad, m.numero""")
    List<Mesa> buscarDisponibles(@Param("inicio") LocalDateTime inicio,
                                 @Param("fin") LocalDateTime fin,
                                 @Param("personas") int personas,
                                 @Param("estado") EstadoReserva estadoQueOcupa);
}

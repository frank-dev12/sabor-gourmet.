package com.saborgourmet.repository;

import com.saborgourmet.model.EstadoReserva;
import com.saborgourmet.model.Reserva;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    @Query("""
            select r from Reserva r join fetch r.mesa m
            where (:mesaId is null or m.id = :mesaId)
              and r.fechaHoraInicio >= :desde
              and r.fechaHoraInicio < :hasta
            order by r.fechaHoraInicio, m.numero""")
    List<Reserva> buscar(@Param("mesaId") Long mesaId,
                         @Param("desde") LocalDateTime desde,
                         @Param("hasta") LocalDateTime hasta);

    @Query("select r from Reserva r join fetch r.mesa where r.id = :id")
    Optional<Reserva> findConMesaById(@Param("id") Long id);

    /**
     * Dos intervalos [inicio, fin) se cruzan si cada uno empieza antes de que termine el otro.
     * Una reserva que termina a las 20:00 no choca con otra que empieza a las 20:00.
     */
    @Query("""
            select r from Reserva r
            where r.mesa.id = :mesaId
              and r.estado = :estado
              and r.fechaHoraInicio < :fin
              and r.fechaHoraFin > :inicio
              and (:excluirId is null or r.id <> :excluirId)
            order by r.fechaHoraInicio""")
    List<Reserva> buscarCruces(@Param("mesaId") Long mesaId,
                               @Param("inicio") LocalDateTime inicio,
                               @Param("fin") LocalDateTime fin,
                               @Param("estado") EstadoReserva estadoQueOcupa,
                               @Param("excluirId") Long excluirId);

    boolean existsByMesaIdAndEstadoAndFechaHoraFinAfter(Long mesaId, EstadoReserva estado, LocalDateTime momento);
}

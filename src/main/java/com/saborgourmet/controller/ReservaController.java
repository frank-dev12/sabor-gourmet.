package com.saborgourmet.controller;

import com.saborgourmet.dto.CambioEstadoReservaRequest;
import com.saborgourmet.dto.ReservaRequest;
import com.saborgourmet.dto.ReservaResponse;
import com.saborgourmet.service.ReservaService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    /** Sin {@code fecha} devuelve las reservas de hoy. */
    @GetMapping
    public List<ReservaResponse> listar(
            @RequestParam(required = false) Long mesaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return reservaService.listar(mesaId, fecha);
    }

    @GetMapping("/{id}")
    public ReservaResponse obtener(@PathVariable Long id) {
        return reservaService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<ReservaResponse> crear(@Valid @RequestBody ReservaRequest request) {
        ReservaResponse creada = reservaService.crear(request);
        URI ubicacion = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(creada.id())
                .toUri();
        return ResponseEntity.created(ubicacion).body(creada);
    }

    @PutMapping("/{id}")
    public ReservaResponse actualizar(@PathVariable Long id, @Valid @RequestBody ReservaRequest request) {
        return reservaService.actualizar(id, request);
    }

    @PatchMapping("/{id}/estado")
    public ReservaResponse cambiarEstado(@PathVariable Long id, @Valid @RequestBody CambioEstadoReservaRequest request) {
        return reservaService.cambiarEstado(id, request.estado());
    }
}

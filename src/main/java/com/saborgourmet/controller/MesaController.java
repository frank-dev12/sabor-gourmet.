package com.saborgourmet.controller;

import com.saborgourmet.dto.MesaRequest;
import com.saborgourmet.dto.MesaResponse;
import com.saborgourmet.service.MesaService;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/mesas")
public class MesaController {

    private final MesaService mesaService;

    public MesaController(MesaService mesaService) {
        this.mesaService = mesaService;
    }

    @GetMapping
    public List<MesaResponse> listar(@RequestParam(defaultValue = "false") boolean soloActivas) {
        return mesaService.listar(soloActivas);
    }

    @GetMapping("/disponibles")
    public List<MesaResponse> disponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin,
            @RequestParam(defaultValue = "1") int personas) {
        return mesaService.disponibles(inicio, fin, personas);
    }

    @GetMapping("/{id}")
    public MesaResponse obtener(@PathVariable Long id) {
        return mesaService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<MesaResponse> crear(@Valid @RequestBody MesaRequest request) {
        MesaResponse creada = mesaService.crear(request);
        URI ubicacion = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(creada.id())
                .toUri();
        return ResponseEntity.created(ubicacion).body(creada);
    }

    @PutMapping("/{id}")
    public MesaResponse actualizar(@PathVariable Long id, @Valid @RequestBody MesaRequest request) {
        return mesaService.actualizar(id, request);
    }

    /** Baja lógica: se conserva el historial de reservas de la mesa. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        mesaService.desactivar(id);
        return ResponseEntity.noContent().build();
    }
}

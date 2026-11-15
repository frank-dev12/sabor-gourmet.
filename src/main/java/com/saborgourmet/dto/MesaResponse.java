package com.saborgourmet.dto;

import com.saborgourmet.model.Mesa;

public record MesaResponse(Long id, Integer numero, Integer capacidad, String ubicacion, boolean activa) {

    public static MesaResponse desde(Mesa m) {
        return new MesaResponse(m.getId(), m.getNumero(), m.getCapacidad(), m.getUbicacion(), m.isActiva());
    }
}

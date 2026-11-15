package com.saborgourmet.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
class ReservaControllerTest {

    private static final LocalDate DIA = LocalDate.now().plusDays(30);

    @Autowired
    private MockMvc mockMvc;

    @Test
    void impideCrucesDeHorarioEnLaMismaMesa() throws Exception {
        long mesa = crearMesa(4);

        String location = reservar(mesa, "20:00", "22:00", 2)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("CONFIRMADA"))
                .andReturn().getResponse().getHeader("Location");

        reservar(mesa, "21:00", "23:00", 2)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(containsString("ya está reservada")));
        reservar(mesa, "19:00", "20:30", 2).andExpect(status().isConflict());
        reservar(mesa, "20:30", "21:30", 2).andExpect(status().isConflict());

        reservar(mesa, "22:00", "23:30", 2).andExpect(status().isCreated());
        reservar(mesa, "18:30", "20:00", 2).andExpect(status().isCreated());

        long otraMesa = crearMesa(4);
        reservar(otraMesa, "20:00", "22:00", 2).andExpect(status().isCreated());

        mockMvc.perform(patch(location + "/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\": \"CANCELADA\"}"))
                .andExpect(status().isOk());
        reservar(mesa, "20:30", "21:30", 2).andExpect(status().isCreated());
    }

    @Test
    void actualizarNoChocaConsigoMismaPeroSiConOtras() throws Exception {
        long mesa = crearMesa(4);
        String location = reservar(mesa, "13:00", "14:30", 2)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        reservar(mesa, "15:00", "16:00", 2).andExpect(status().isCreated());

        mockMvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reserva(mesa, "13:30", "15:00", 3)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.numeroPersonas").value(3));

        mockMvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reserva(mesa, "14:00", "15:30", 2)))
                .andExpect(status().isConflict());
    }

    @Test
    void validaCapacidadYRangoHorario() throws Exception {
        long mesa = crearMesa(2);

        reservar(mesa, "12:00", "13:00", 5)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(containsString("capacidad")));

        reservar(mesa, "13:00", "12:00", 2)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.rangoValido").exists());
    }

    @Test
    void disponiblesExcluyeMesasOcupadas() throws Exception {
        long ocupada = crearMesa(6);
        long libre = crearMesa(6);
        reservar(ocupada, "10:00", "11:00", 4).andExpect(status().isCreated());

        mockMvc.perform(get("/api/mesas/disponibles")
                        .param("inicio", DIA.atTime(10, 30).toString())
                        .param("fin", DIA.atTime(11, 30).toString())
                        .param("personas", "4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem((int) ocupada))))
                .andExpect(jsonPath("$[*].id", hasItem((int) libre)));
    }

    private long crearMesa(int capacidad) throws Exception {
        int numero = ThreadLocalRandom.current().nextInt(1_000, 1_000_000);
        String respuesta = mockMvc.perform(post("/api/mesas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"numero\": %d, \"capacidad\": %d, \"ubicacion\": \"Terraza\"}"
                                .formatted(numero, capacidad)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(respuesta, "$.id")).longValue();
    }

    private ResultActions reservar(long mesaId, String inicio, String fin, int personas) throws Exception {
        return mockMvc.perform(post("/api/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(reserva(mesaId, inicio, fin, personas)));
    }

    private static String reserva(long mesaId, String inicio, String fin, int personas) {
        return """
                {"mesaId": %d, "nombreCliente": "Luis Pérez", "telefono": "999888777",
                 "numeroPersonas": %d, "fechaHoraInicio": "%s", "fechaHoraFin": "%s"}
                """.formatted(mesaId, personas, enDia(inicio), enDia(fin));
    }

    private static LocalDateTime enDia(String hora) {
        return LocalDateTime.of(DIA, LocalTime.parse(hora));
    }
}

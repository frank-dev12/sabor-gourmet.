package com.saborgourmet.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.endsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class PedidoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void creaPedidoDescontandoStockYLoReponeAlCancelar() throws Exception {
        long lomo = crearProducto("32.50", 10);
        long chicha = crearProducto("8.00", 5);

        String location = mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pedido(item(lomo, 2), item(chicha, 1), item(lomo, 1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].cantidad").value(3))
                .andExpect(jsonPath("$.items[0].precioUnitario").value(32.50))
                .andExpect(jsonPath("$.total").value(105.50))
                .andReturn().getResponse().getHeader("Location");

        verificarStock(lomo, 7);
        verificarStock(chicha, 4);

        mockMvc.perform(patch(location + "/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\": \"CANCELADO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADO"));

        verificarStock(lomo, 10);
        verificarStock(chicha, 5);

        mockMvc.perform(patch(location + "/estado")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\": \"ENTREGADO\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void rechazaPedidoSinStockSuficienteSinTocarElInventario() throws Exception {
        long conStock = crearProducto("10.00", 5);
        long escaso = crearProducto("15.00", 1);

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pedido(item(conStock, 2), item(escaso, 2))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(containsString("solicitado 2, disponible 1")));

        verificarStock(conStock, 5);
        verificarStock(escaso, 1);
    }

    @Test
    void actualizarPedidoRecalculaElStock() throws Exception {
        long producto = crearProducto("20.00", 5);

        String location = mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pedido(item(producto, 3))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");
        verificarStock(producto, 2);

        mockMvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pedido(item(producto, 4))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(80.00));
        verificarStock(producto, 1);

        mockMvc.perform(put(location)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pedido(item(producto, 6))))
                .andExpect(status().isConflict());
        verificarStock(producto, 1);

        mockMvc.perform(delete(location)).andExpect(status().isNoContent());
        verificarStock(producto, 5);
    }

    @Test
    void rechazaProductosInactivosOInexistentes() throws Exception {
        long inactivo = crearProducto("9.90", 10);
        mockMvc.perform(delete("/api/productos/" + inactivo)).andExpect(status().isNoContent());

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pedido(item(inactivo, 1))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(containsString("no está disponible")));

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(pedido(item(987654321L, 1))))
                .andExpect(status().isNotFound());
    }

    @Test
    void creaPedidoADomicilioConDireccionYPago() throws Exception {
        long producto = crearProducto("15.00", 5);

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombreCliente": "Luis Díaz", "tipo": "DOMICILIO",
                                 "direccionEntrega": "Av. Lima 123", "metodoPago": "BILLETERA_DIGITAL",
                                 "items": [%s]}
                                """.formatted(item(producto, 1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("DOMICILIO"))
                .andExpect(jsonPath("$.direccionEntrega").value("Av. Lima 123"))
                .andExpect(jsonPath("$.metodoPago").value("BILLETERA_DIGITAL"))
                .andExpect(jsonPath("$.numeroMesa").doesNotExist());
    }

    @Test
    void rechazaDomicilioSinDireccionNiPago() throws Exception {
        long producto = crearProducto("10.00", 5);

        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombreCliente": "Luis Díaz", "tipo": "DOMICILIO", "items": [%s]}
                                """.formatted(item(producto, 1))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(containsString("direccionEntrega")));
    }

    @Test
    void rechazaPedidoInvalido() throws Exception {
        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombreCliente\": \"\", \"tipo\": \"PARA_LLEVAR\", \"items\": []}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombreCliente").exists())
                .andExpect(jsonPath("$.errores.items").exists());
    }

    @Test
    void devuelve404SiNoExiste() throws Exception {
        mockMvc.perform(get("/api/pedidos/999999"))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", endsWith("problem+json")));
    }

    private long crearProducto(String precio, int stock) throws Exception {
        String json = """
                {"nombre": "Producto %s", "categoria": "PLATO_FUERTE", "precio": %s, "stock": %d}
                """.formatted(UUID.randomUUID(), precio, stock);
        String respuesta = mockMvc.perform(post("/api/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(respuesta, "$.id")).longValue();
    }

    private void verificarStock(long productoId, int esperado) throws Exception {
        mockMvc.perform(get("/api/productos/" + productoId))
                .andExpect(jsonPath("$.stock").value(esperado));
    }

    private static String item(long productoId, int cantidad) {
        return "{\"productoId\": %d, \"cantidad\": %d}".formatted(productoId, cantidad);
    }

    private static String pedido(String... items) {
        return """
                {"nombreCliente": "Ana Torres", "tipo": "EN_MESA", "numeroMesa": 4, "items": [%s]}
                """.formatted(String.join(",", items));
    }
}

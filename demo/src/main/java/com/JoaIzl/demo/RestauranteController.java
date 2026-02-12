package com.JoaIzl.demo;

// 1. TODOS los imports van aquí arriba
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 2. Aquí empieza la clase del controlador
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RestauranteController {

    // Simulamos una base de datos de pedidos en memoria
    private List<Pedido> pedidos = new ArrayList<>();

    // GET /api/menu
    @GetMapping("/menu")
    public List<Articulo> obtenerMenu() {
        return List.of(
                new Articulo("Hamburguesa Deluxe", 1, "Con queso y bacon", 5.50),
                new Articulo("Papas Fritas", 1, "Ración grande", 2.50),
                new Articulo("Refresco", 1, "Coca-Cola 500ml", 1.50),
                new Articulo("Pizza Margarita", 1, "Tomate y mozzarella", 8.00)
        );
    }

    // GET /api/pedidos - Lista todos los pedidos para el panel del trabajador
    @GetMapping("/pedidos")
    public List<Pedido> obtenerPedidos() {
        return pedidos;
    }

    // POST /api/pedido
    @PostMapping("/pedido")
    public Pedido crearPedido(@RequestBody DatosPedido datos) {
        Pedido nuevoPedido = new Pedido(datos.nombreCliente, datos.mesa);

        for (Articulo art : datos.articulos) {
            nuevoPedido.agregarArticulo(art);
        }

        pedidos.add(nuevoPedido);
        return nuevoPedido;
    }

    // Record auxiliar
    public record DatosPedido(String nombreCliente, int mesa, List<Articulo> articulos) {

    }
}

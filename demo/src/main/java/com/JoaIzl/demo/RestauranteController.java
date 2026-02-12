package com.JoaIzl.demo;

// 1. TODOS los imports van aquí arriba
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 2. Aquí empieza la clase del controlador
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RestauranteController {

    // Simulamos una base de datos en memoria
    private List<Pedido> pedidos = new ArrayList<>();
    private List<Articulo> menuArticulos = new ArrayList<>(List.of(
            new Articulo("Hamburguesa Deluxe", 1, "Con queso y bacon", 5.50),
            new Articulo("Papas Fritas", 1, "Ración grande", 2.50),
            new Articulo("Refresco", 1, "Coca-Cola 500ml", 1.50),
            new Articulo("Pizza Margarita", 1, "Tomate y mozzarella", 8.00)
    ));
    private int numMesas = 6;
    private List<Map<String, Object>> notificaciones = new CopyOnWriteArrayList<>();

    // ========== MENÚ ==========
    // GET /api/menu
    @GetMapping("/menu")
    public List<Articulo> obtenerMenu() {
        return menuArticulos;
    }

    // GET /api/mesas
    @GetMapping("/mesas")
    public Map<String, Integer> obtenerMesas() {
        return Map.of("numMesas", numMesas);
    }

    // ========== PEDIDOS ==========
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

    // PUT /api/pedido/{id}/estado - Cambiar estado de un pedido
    @PutMapping("/pedido/{id}/estado")
    public Pedido cambiarEstado(@PathVariable int id, @RequestBody Map<String, String> body) {
        for (Pedido p : pedidos) {
            if (p.getId() == id) {
                p.setEstado(EstadoPedido.valueOf(body.get("estado")));
                return p;
            }
        }
        return null;
    }

    // POST /api/pedido/{id}/pagar - Cliente pide la cuenta
    @PostMapping("/pedido/{id}/pagar")
    public Map<String, Object> pedirCuenta(@PathVariable int id, @RequestBody Map<String, String> body) {
        String metodoPago = body.get("metodoPago");
        for (Pedido p : pedidos) {
            if (p.getId() == id) {
                p.setEstado(EstadoPedido.CUENTA_PEDIDA);
                p.setMetodoPago(metodoPago);

                // Crear notificación para el trabajador
                Map<String, Object> notif = Map.of(
                        "pedidoId", p.getId(),
                        "mesa", p.getMesa(),
                        "cliente", p.getNombreCliente(),
                        "total", p.getTotal(),
                        "metodoPago", metodoPago,
                        "timestamp", System.currentTimeMillis()
                );
                notificaciones.add(notif);

                return Map.of("ok", true, "mensaje", "Cuenta solicitada");
            }
        }
        return Map.of("ok", false, "mensaje", "Pedido no encontrado");
    }

    // DELETE /api/pedido/{id}
    @DeleteMapping("/pedido/{id}")
    public Map<String, Object> eliminarPedido(@PathVariable int id) {
        boolean removed = pedidos.removeIf(p -> p.getId() == id);
        return Map.of("ok", removed);
    }

    // ========== NOTIFICACIONES ==========
    // GET /api/notificaciones - Obtener notificaciones de pago para trabajadores
    @GetMapping("/notificaciones")
    public List<Map<String, Object>> obtenerNotificaciones() {
        return notificaciones;
    }

    // DELETE /api/notificacion/{index} - Descartar una notificación
    @DeleteMapping("/notificacion/{index}")
    public Map<String, Object> descartarNotificacion(@PathVariable int index) {
        if (index >= 0 && index < notificaciones.size()) {
            notificaciones.remove(index);
            return Map.of("ok", true);
        }
        return Map.of("ok", false);
    }

    // ========== ADMIN ==========
    // POST /api/admin/articulo - Añadir artículo al menú
    @PostMapping("/admin/articulo")
    public Articulo agregarArticulo(@RequestBody Articulo articulo) {
        menuArticulos.add(articulo);
        return articulo;
    }

    // PUT /api/admin/articulo/{index} - Editar artículo del menú
    @PutMapping("/admin/articulo/{index}")
    public Articulo editarArticulo(@PathVariable int index, @RequestBody Articulo articulo) {
        if (index >= 0 && index < menuArticulos.size()) {
            menuArticulos.set(index, articulo);
            return articulo;
        }
        return null;
    }

    // DELETE /api/admin/articulo/{index} - Eliminar artículo del menú
    @DeleteMapping("/admin/articulo/{index}")
    public Map<String, Object> eliminarArticulo(@PathVariable int index) {
        if (index >= 0 && index < menuArticulos.size()) {
            menuArticulos.remove(index);
            return Map.of("ok", true);
        }
        return Map.of("ok", false);
    }

    // PUT /api/admin/mesas - Cambiar número de mesas
    @PutMapping("/admin/mesas")
    public Map<String, Object> cambiarMesas(@RequestBody Map<String, Integer> body) {
        this.numMesas = body.get("numMesas");
        return Map.of("ok", true, "numMesas", numMesas);
    }

    // Record auxiliar
    public record DatosPedido(String nombreCliente, int mesa, List<Articulo> articulos) {

    }
}

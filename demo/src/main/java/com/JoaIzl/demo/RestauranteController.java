package com.JoaIzl.demo;

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

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RestauranteController {

    // Simulamos una base de datos en memoria
    private List<Pedido> pedidos = new ArrayList<>();

    // Lista mutable para poder añadir/borrar platos
    private List<Articulo> menuArticulos = new ArrayList<>(List.of(
            new Articulo("Hamburguesa Deluxe", 1, "Con queso y bacon", 5.50),
            new Articulo("Papas Fritas", 1, "Ración grande", 2.50),
            new Articulo("Refresco", 1, "Coca-Cola 500ml", 1.50),
            new Articulo("Pizza Margarita", 1, "Tomate y mozzarella", 8.00)
    ));

    private int numMesas = 6;
    private List<Map<String, Object>> notificaciones = new CopyOnWriteArrayList<>();

    // ========== MENÚ ==========
    @GetMapping("/menu")
    public List<Articulo> obtenerMenu() {
        return menuArticulos;
    }

    @GetMapping("/mesas")
    public Map<String, Integer> obtenerMesas() {
        return Map.of("numMesas", numMesas);
    }

    // ========== PEDIDOS ==========
    @GetMapping("/pedidos")
    public List<Pedido> obtenerPedidos() {
        return pedidos;
    }

    @PostMapping("/pedido")
    public Pedido crearPedido(@RequestBody DatosPedido datos) {
        // Buscar si ya existe un pedido activo para la misma mesa y cliente
        for (Pedido p : pedidos) {
            boolean mismaMesa = p.getMesa() == datos.mesa;
            boolean mismoCliente = p.getNombreCliente().equalsIgnoreCase(datos.nombreCliente);
            boolean activo = p.getEstado() == EstadoPedido.EN_PREPARACION
                    || p.getEstado() == EstadoPedido.LISTO_PARA_ENTREGAR;

            if (mismaMesa && mismoCliente && activo) {
                // Añadir artículos al pedido existente
                for (Articulo art : datos.articulos) {
                    p.agregarArticulo(art);
                }
                return p;
            }
        }

        // Si no existe, crear uno nuevo
        Pedido nuevoPedido = new Pedido(datos.nombreCliente, datos.mesa);
        for (Articulo art : datos.articulos) {
            nuevoPedido.agregarArticulo(art);
        }
        pedidos.add(nuevoPedido);
        return nuevoPedido;
    }

    @PostMapping("/pedido/{id}/avanzar")
    public Pedido avanzarEstadoPedido(@PathVariable int id) {
        for (Pedido p : pedidos) {
            if (p.getId() == id) {
                p.avanzarEstado();
                return p;
            }
        }
        return null;
    }

    // PUT /api/pedido/{id}/estado - Cambiar estado manualmente
    @PutMapping("/pedido/{id}/estado")
    public Pedido cambiarEstado(@PathVariable int id, @RequestBody Map<String, String> body) {
        for (Pedido p : pedidos) {
            if (p.getId() == id) {
                // Asegúrate de que tu Enum tenga este valor o controla la excepción
                try {
                    p.setEstado(EstadoPedido.valueOf(body.get("estado")));
                    return p;
                } catch (Exception e) {
                    return null;
                }
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
                p.setEstado(EstadoPedido.CUENTA_PEDIDA); // Asegúrate de añadir CUENTA_PEDIDA en tu Enum
                p.setMetodoPago(metodoPago); // Asegúrate de añadir este método en Pedido.java

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

    @DeleteMapping("/pedido/{id}")
    public Map<String, Object> eliminarPedido(@PathVariable int id) {
        boolean removed = pedidos.removeIf(p -> p.getId() == id);
        return Map.of("ok", removed);
    }

    // ========== NOTIFICACIONES ==========
    @GetMapping("/notificaciones")
    public List<Map<String, Object>> obtenerNotificaciones() {
        return notificaciones;
    }

    @DeleteMapping("/notificacion/{index}")
    public Map<String, Object> descartarNotificacion(@PathVariable int index) {
        if (index >= 0 && index < notificaciones.size()) {
            notificaciones.remove(index);
            return Map.of("ok", true);
        }
        return Map.of("ok", false);
    }

    // ========== ADMIN ==========
    @PostMapping("/admin/articulo")
    public Articulo agregarArticulo(@RequestBody Articulo articulo) {
        menuArticulos.add(articulo);
        return articulo;
    }

    @PutMapping("/admin/articulo/{index}")
    public Articulo editarArticulo(@PathVariable int index, @RequestBody Articulo articulo) {
        if (index >= 0 && index < menuArticulos.size()) {
            menuArticulos.set(index, articulo);
            return articulo;
        }
        return null;
    }

    @DeleteMapping("/admin/articulo/{index}")
    public Map<String, Object> eliminarArticulo(@PathVariable int index) {
        if (index >= 0 && index < menuArticulos.size()) {
            menuArticulos.remove(index);
            return Map.of("ok", true);
        }
        return Map.of("ok", false);
    }

    @PutMapping("/admin/mesas")
    public Map<String, Object> cambiarMesas(@RequestBody Map<String, Integer> body) {
        this.numMesas = body.get("numMesas");
        return Map.of("ok", true, "numMesas", numMesas);
    }

    // Record auxiliar
    public record DatosPedido(String nombreCliente, int mesa, List<Articulo> articulos) {

    }
}

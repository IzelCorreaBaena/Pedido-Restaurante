package com.JoaIzl.demo;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.io.File;
import java.io.IOException;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RestauranteController { // <--- ¡YA NO ES ABSTRACT NI IMPLEMENTS NADA!

    private List<Pedido> pedidos = new ArrayList<>();
    
    // Lista del menú 
    private List<Articulo> menuArticulos = new ArrayList<>(List.of(
            new Articulo("Hamburguesa Deluxe", 1, "Con queso y bacon", 5.50),
            new Articulo("Papas Fritas", 1, "Ración grande", 2.50),
            new Articulo("Refresco", 1, "Coca-Cola 500ml", 1.50),
            new Articulo("Pizza Margarita", 1, "Tomate y mozzarella", 8.00)
    ));

    private int numMesas = 6;
    private List<Map<String, Object>> notificaciones = new CopyOnWriteArrayList<>();

    // Configuración de persistencia
    private final String RUTA_ARCHIVO = "pedidos.json";
    private ObjectMapper mapper = new ObjectMapper();

    // Constructor
    public RestauranteController() {
        cargarDatos(); 
    }

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
        for (Pedido p : pedidos) {
            boolean mismaMesa = p.getMesa() == datos.mesa;
            boolean mismoCliente = p.getNombreCliente().equalsIgnoreCase(datos.nombreCliente);
            boolean activo = p.getEstado() == EstadoPedido.EN_PREPARACION || p.getEstado() == EstadoPedido.LISTO_PARA_ENTREGAR;

            if (mismaMesa && mismoCliente && activo) {
                for (Articulo art : datos.articulos) {
                    p.agregarArticulo(art);
                }
                guardarDatos();
                return p;
            }
        }

        Pedido nuevoPedido = new Pedido(datos.nombreCliente, datos.mesa);
        for (Articulo art : datos.articulos) {
            nuevoPedido.agregarArticulo(art);
        }
        pedidos.add(nuevoPedido);
        
        guardarDatos();
        return nuevoPedido;
    }

    @PostMapping("/pedido/{id}/avanzar")
    public Pedido avanzarEstadoPedido(@PathVariable int id) {
        for (Pedido p : pedidos) {
            if (p.getId() == id) {
                p.avanzarEstado();
                guardarDatos();
                return p;
            }
        }
        return null;
    }

    @PutMapping("/pedido/{id}/estado")
    public Pedido cambiarEstado(@PathVariable int id, @RequestBody Map<String, String> body) {
        for (Pedido p : pedidos) {
            if (p.getId() == id) {
                try {
                    p.setEstado(EstadoPedido.valueOf(body.get("estado")));
                    guardarDatos();
                    return p;
                } catch (Exception e) {
                    return null;
                }
            }
        }
        return null;
    }

    @PostMapping("/pedido/{id}/pagar")
    public Map<String, Object> pedirCuenta(@PathVariable int id, @RequestBody Map<String, String> body) {
        String metodoPago = body.get("metodoPago");
        for (Pedido p : pedidos) {
            if (p.getId() == id) {
                p.setEstado(EstadoPedido.CUENTA_PEDIDA);
                p.setMetodoPago(metodoPago);
                
                guardarDatos(); 

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
        if(removed) guardarDatos();
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

    // ========== ADMIN (Menú) ==========
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

    // ========== MÉTODOS DE PERSISTENCIA (JSON) ==========
    
    private void guardarDatos() {
        try {
            // writeValue viene de Jackson (com.fasterxml...)
            mapper.writeValue(new File(RUTA_ARCHIVO), pedidos);
            System.out.println("💾 Datos guardados en " + RUTA_ARCHIVO);
        } catch (IOException e) {
            System.err.println("❌ Error al guardar: " + e.getMessage());
        }
    }

    private void cargarDatos() {
        try {
            File archivo = new File(RUTA_ARCHIVO);
            if (archivo.exists()) {
                // AQUÍ USAMOS TypeReference de forma anónima
                pedidos = mapper.readValue(archivo, new TypeReference<List<Pedido>>(){});
                System.out.println("📂 Pedidos cargados: " + pedidos.size());
            }
        } catch (IOException e) {
            System.err.println("❌ Error al cargar: " + e.getMessage());
        }
    }

    public record DatosPedido(String nombreCliente, int mesa, List<Articulo> articulos) {}
}
package com.JoaIzl.demo;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.io.File;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.type.TypeReference;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RestauranteController {

    private List<Pedido> pedidos = new ArrayList<>();
    private List<Pedido> historialPedidos = new ArrayList<>();

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
    private final String RUTA_HISTORIAL = "historial.json";
    private ObjectMapper mapper = new ObjectMapper();

    // Constructor
    public RestauranteController() {
        cargarDatos();
        cargarHistorial();
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
        Pedido encontrado = null;
        for (Pedido p : pedidos) {
            if (p.getId() == id) {
                encontrado = p;
                break;
            }
        }
        if (encontrado == null) {
            return null;
        }

        try {
            EstadoPedido nuevoEstado = EstadoPedido.valueOf(body.get("estado"));
            encontrado.setEstado(nuevoEstado);

            // Si se marca como PAGADO, mover al historial
            if (nuevoEstado == EstadoPedido.PAGADO) {
                historialPedidos.add(encontrado);
                pedidos.remove(encontrado);
                guardarHistorial();
            }

            guardarDatos();
            return encontrado;
        } catch (Exception e) {
            return null;
        }
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
        if (removed) {
            guardarDatos();
        }
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

    // ========== HISTORIAL DEL DÍA ==========
    @GetMapping("/admin/historial")
    public List<Pedido> obtenerHistorial() {
        return historialPedidos;
    }

    @GetMapping("/admin/historial/hoy")
    public Map<String, Object> obtenerResumenDiario() {
        String hoy = LocalDate.now().toString();
        List<Pedido> pedidosHoy = historialPedidos.stream()
                .filter(p -> p.getFechaCreacion() != null && p.getFechaCreacion().startsWith(hoy))
                .toList();

        double totalVentas = pedidosHoy.stream().mapToDouble(Pedido::getTotal).sum();
        totalVentas = Math.round(totalVentas * 100.0) / 100.0;
        long pagosTarjeta = pedidosHoy.stream().filter(p -> "tarjeta".equals(p.getMetodoPago())).count();
        long pagosEfectivo = pedidosHoy.stream().filter(p -> "efectivo".equals(p.getMetodoPago())).count();

        return Map.of(
                "totalVentas", totalVentas,
                "totalPedidos", pedidosHoy.size(),
                "pagosTarjeta", pagosTarjeta,
                "pagosEfectivo", pagosEfectivo,
                "pedidos", pedidosHoy
        );
    }

    @DeleteMapping("/admin/historial")
    public Map<String, Object> limpiarHistorial() {
        historialPedidos.clear();
        guardarHistorial();
        return Map.of("ok", true);
    }

    // ========== MÉTODOS DE PERSISTENCIA (JSON) ==========
    private void guardarDatos() {
        try {
            mapper.writeValue(new File(RUTA_ARCHIVO), pedidos);
        } catch (Exception e) {
            System.err.println("Error al guardar pedidos: " + e.getMessage());
        }
    }

    private void cargarDatos() {
        try {
            File archivo = new File(RUTA_ARCHIVO);
            if (archivo.exists()) {
                pedidos = mapper.readValue(archivo, new TypeReference<List<Pedido>>() {
                });
                System.out.println("Pedidos cargados: " + pedidos.size());
            }
        } catch (Exception e) {
            System.err.println("Error al cargar pedidos: " + e.getMessage());
        }
    }

    private void guardarHistorial() {
        try {
            mapper.writeValue(new File(RUTA_HISTORIAL), historialPedidos);
        } catch (Exception e) {
            System.err.println("Error al guardar historial: " + e.getMessage());
        }
    }

    private void cargarHistorial() {
        try {
            File archivo = new File(RUTA_HISTORIAL);
            if (archivo.exists()) {
                historialPedidos = mapper.readValue(archivo, new TypeReference<List<Pedido>>() {
                });
                System.out.println("Historial cargado: " + historialPedidos.size());
            }
        } catch (Exception e) {
            System.err.println("Error al cargar historial: " + e.getMessage());
        }
    }

    public record DatosPedido(String nombreCliente, int mesa, List<Articulo> articulos) {

    }
}

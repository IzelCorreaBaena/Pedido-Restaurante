package com.JoaIzl.demo;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

public class Pedido {

    private int id;
    private String nombreCliente;
    private int mesa;
    private List<Articulo> articulos;
    private EstadoPedido estado;
    private String fechaCreacion;

    private double subtotal;
    private double igic;
    private double total;
    private String metodoPago;

    // 1. CONSTRUCTOR VACÍO (OBLIGATORIO PARA JSON)
    public Pedido() {
    }

    public Pedido(String nombreCliente, int mesa) {
        this.id = (int) (Math.random() * 100000);
        this.nombreCliente = nombreCliente;
        this.mesa = mesa;
        this.articulos = new ArrayList<>();
        this.estado = EstadoPedido.EN_PREPARACION;
        this.fechaCreacion = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    public void agregarArticulo(Articulo articulo) {
        this.articulos.add(articulo);
        recalcularTotales();
    }

    public void recalcularTotales() {
        this.subtotal = 0;
        for (Articulo art : articulos) {
            this.subtotal += art.precio() * art.cantidad();
        }
        this.igic = this.subtotal * 0.07;
        this.total = this.subtotal + this.igic;
    }

    public void avanzarEstado() {
        if (this.estado == EstadoPedido.EN_PREPARACION) {
            this.estado = EstadoPedido.LISTO_PARA_ENTREGAR;
        } else if (this.estado == EstadoPedido.LISTO_PARA_ENTREGAR) {
            this.estado = EstadoPedido.ENTREGADO;
        }
    }

    // Getters y Setters
    public int getId() {
        return id;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public int getMesa() {
        return mesa;
    }

    public List<Articulo> getArticulos() {
        return articulos;
    }

    public EstadoPedido getEstado() {
        return estado;
    }

    public double getSubtotal() {
        return subtotal;
    }

    public double getIgic() {
        return igic;
    }

    public double getTotal() {
        return total;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public String getFechaCreacion() {
        return fechaCreacion;
    }

    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public void setMesa(int mesa) {
        this.mesa = mesa;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public void setFechaCreacion(String fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public void setArticulos(List<Articulo> articulos) {
        this.articulos = articulos;
        recalcularTotales();
    }

    // Setter de ID necesario para cargar desde JSON
    public void setId(int id) {
        this.id = id;
    }
}

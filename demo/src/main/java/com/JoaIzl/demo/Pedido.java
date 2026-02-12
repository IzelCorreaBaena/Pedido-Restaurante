package com.JoaIzl.demo;

import java.util.ArrayList;
import java.util.List;

public class Pedido {

    private static int contadorPedidos = 0;

    private final int id;
    private String nombreCliente;
    private int mesa;
    private List<Articulo> articulos;
    private EstadoPedido estado;

    private double subtotal;
    private double igic;
    private double total;

    public Pedido(String nombreCliente, int mesa) {
        this.id = (int) (Math.random() * 100000);
        this.nombreCliente = nombreCliente;
        this.mesa = mesa;
        this.articulos = new ArrayList<>();
        this.estado = EstadoPedido.EN_PREPARACION;
        contadorPedidos++;
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
        this.igic = this.subtotal * 0.07; // Tu IGIC del 7%
        this.total = this.subtotal + this.igic;
    }

    // Getters para JSON
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
}

package com.JoaIzl.demo;

import java.util.ArrayList;
import java.util.List;

public class Pedido {
    private static int contadorPedidos = 0;
    
    private final int id;
    private String nombreCliente;
    private List<Articulo> articulos; // Usamos List en vez de Array para web
    private EstadoPedido estado;
    
    // Variables calculadas para enviarlas al frontend
    private double subtotal;
    private double igic;
    private double total;

    public Pedido(String nombreCliente) {
        this.id = (int)(Math.random() * 100000); // Tu lógica de ID
        this.nombreCliente = nombreCliente;
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

    // Getters necesarios para que Spring convierta esto a JSON
    public int getId() { return id; }
    public String getNombreCliente() { return nombreCliente; }
    public List<Articulo> getArticulos() { return articulos; }
    public EstadoPedido getEstado() { return estado; }
    public double getSubtotal() { return subtotal; }
    public double getIgic() { return igic; }
    public double getTotal() { return total; }
}

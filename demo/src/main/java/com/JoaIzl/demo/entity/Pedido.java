package com.JoaIzl.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Entity
@Table(name = "pedidos")
public class Pedido {

    private static final AtomicInteger CONTADOR = new AtomicInteger(1);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String numeroPedido;
    private String nombreCliente;
    @Enumerated(EnumType.STRING)
    private EstadoPedido estado;
    private double subtotal;
    private double total;
    private double propina;
    private double igic;
    @Enumerated(EnumType.STRING)
    private MetodoPago metodoPago;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaPago;

    @Column(name = "fecha_hora")
    private LocalDateTime fechaHora;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PedidoArticulo> pedidoArticulos = new ArrayList<>();


    public Pedido() {
        this.numeroPedido = this.numeroPedido = "PED-" + String.format("%04d", CONTADOR.getAndIncrement());
        this.estado = EstadoPedido.EN_PREPARACION;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaHora = LocalDateTime.now();
    }


    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public String getNumeroPedido() {
        return numeroPedido;
    }


    public void setNumeroPedido(String numeroPedido) {
        this.numeroPedido = numeroPedido;
    }


    public String getNombreCliente() {
        return nombreCliente;
    }


    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }


    public EstadoPedido getEstado() {
        return estado;
    }


    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }


    public double getSubtotal() {
        return subtotal;
    }


    public void setSubtotal(double subtotal) {
        this.subtotal = subtotal;
    }


    public double getTotal() {
        return total;
    }


    public void setTotal(double total) {
        this.total = total;
    }


    public double getPropina() {
        return propina;
    }


    public void setPropina(double propina) {
        this.propina = propina;
    }


    public double getIgic() {
        return igic;
    }


    public void setIgic(double igic) {
        this.igic = igic;
    }


    public MetodoPago getMetodoPago() {
        return metodoPago;
    }


    public void setMetodoPago(MetodoPago metodoPago) {
        this.metodoPago = metodoPago;
    }


    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }


    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }


    public LocalDateTime getFechaPago() {
        return fechaPago;
    }


    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }


    public LocalDateTime getFechaHora() {
        return fechaHora;
    }


    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public enum EstadoPedido {
    EN_PREPARACION,
    LISTO_PARA_ENTREGAR,
    ENTREGADO,
    CUENTA_PEDIDA,
    PAGADO
    }

    public enum MetodoPago {
        EFECTIVO,
        TARJETA
    }
}

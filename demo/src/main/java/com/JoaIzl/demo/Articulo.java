package com.JoaIzl.demo;

public record Articulo (
    String nombre,
    int cantidad,
    String descripcion,
    double precio
) {
   
    public Articulo {
        if (nombre == null) {
            throw new IllegalArgumentException("El nombre no puede ser nulo");
        }
        if (precio <= 0) {
            throw new IllegalArgumentException("El precio debe ser positivo");
        }
        if (cantidad < 0) {
            throw new IllegalArgumentException("La cantidad no puede ser negativa");
        }
        if (descripcion == null) {
        descripcion = "No hay descripcion";
    }
    }
    public Articulo cambiarNombre(String nuevoNombre) {
        return new Articulo(nuevoNombre, cantidad, descripcion, precio);
    }
    public Articulo cambiarCantidad(int nuevaCantidad) {
        return new Articulo(nombre, nuevaCantidad, descripcion, precio);
    }
    public Articulo cambiarDescripcion(String nuevaDescripcion) {
        return new Articulo(nombre, cantidad, nuevaDescripcion, precio);
    }
    public Articulo cambiarPrecio(double nuevoPrecio) {
        return new Articulo(nombre, cantidad, descripcion, nuevoPrecio);
    }

    public void mostrarInfo() {
        System.out.println("Nombre: " + nombre);
        System.out.println("Cantidad: " + cantidad);
        System.out.println("Descripcion: " + descripcion);
        System.out.println("Precio: " + precio);
    }
}

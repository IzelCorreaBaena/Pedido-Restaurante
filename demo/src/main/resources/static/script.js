let carrito = [];

// 1. Cargar menú al iniciar
document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:8080/api/menu')
        .then(res => res.json())
        .then(platos => {
            const contenedor = document.getElementById('menu');
            platos.forEach(plato => {
                contenedor.innerHTML += `
                    <div class="plato-card">
                        <h4>${plato.nombre}</h4>
                        <p>${plato.descripcion}</p>
                        <p class="precio">${plato.precio}€</p>
                        <button onclick="agregar('${plato.nombre}', ${plato.precio})">Añadir</button>
                    </div>
                `;
            });
        });
});

// 2. Añadir al carrito visual
function agregar(nombre, precio) {
    // Creamos un objeto Articulo como lo espera Java (cantidad 1 por defecto)
    carrito.push({ nombre: nombre, precio: precio, cantidad: 1, descripcion: "Pedido web" });
    actualizarCarrito();
}

function actualizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    const totalSpan = document.getElementById('total');
    lista.innerHTML = '';
    
    let total = 0;
    carrito.forEach((item, index) => {
        total += item.precio;
        lista.innerHTML += `<li>${item.nombre} <span>${item.precio}€</span></li>`;
    });
    
    totalSpan.textContent = total.toFixed(2);
}

// 3. Enviar a Spring Boot
function enviarPedido() {
    const nombre = document.getElementById('cliente').value;
    if (!nombre || carrito.length === 0) {
        alert("Por favor, pon tu nombre y elige algún plato.");
        return;
    }

    const datosPedido = {
        nombreCliente: nombre,
        articulos: carrito
    };

    fetch('http://localhost:8080/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPedido)
    })
    .then(res => res.json())
    .then(pedido => {
        alert(`✅ ¡Pedido realizado!\nID: ${pedido.id}\nTotal con IGIC: ${pedido.total.toFixed(2)}€`);
        carrito = []; // Limpiar carrito
        actualizarCarrito();
        document.getElementById('cliente').value = '';
    })
    .catch(err => alert("Error conectando con el servidor"));
}
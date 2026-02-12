let carrito = [];
const API = 'http://localhost:8080/api';

// Cargar menú al iniciar
document.addEventListener('DOMContentLoaded', () => {
    fetch(`${API}/menu`)
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

// Cambiar entre vista cliente y trabajador
function cambiarVista(vista) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`vista-${vista}`).classList.add('activa');
    document.getElementById(`btn-${vista}`).classList.add('active');
    
    // Cargar pedidos al entrar al panel trabajador
    if (vista === 'trabajador') cargarPedidos();
}

// Agregar artículo al carrito
function agregar(nombre, precio) {
    carrito.push({ nombre, precio, cantidad: 1, descripcion: "Pedido web" });
    actualizarCarrito();
}

function actualizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    lista.innerHTML = '';
    let total = 0;
    
    carrito.forEach(item => {
        total += item.precio;
        lista.innerHTML += `<li>${item.nombre} <span>${item.precio}€</span></li>`;
    });
    
    document.getElementById('total').textContent = total.toFixed(2);
}

// Enviar pedido al servidor
function enviarPedido() {
    const nombre = document.getElementById('cliente').value;
    const mesa = document.getElementById('mesa').value;
    
    if (!nombre || !mesa || carrito.length === 0) {
        alert("Completa nombre, mesa y añade algún plato.");
        return;
    }

    fetch(`${API}/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreCliente: nombre, mesa: parseInt(mesa), articulos: carrito })
    })
    .then(res => res.json())
    .then(pedido => {
        alert(`✅ Pedido #${pedido.id}\nMesa: ${pedido.mesa}\nTotal: ${pedido.total.toFixed(2)}€`);
        carrito = [];
        actualizarCarrito();
        document.getElementById('cliente').value = '';
        document.getElementById('mesa').value = '';
    })
    .catch(() => alert("Error conectando con el servidor"));
}

// Cargar pedidos para el panel del trabajador
function cargarPedidos() {
    fetch(`${API}/pedidos`)
        .then(res => res.json())
        .then(pedidos => {
            const contenedor = document.getElementById('lista-pedidos');
            
            if (pedidos.length === 0) {
                contenedor.innerHTML = '<p class="empty-msg">No hay pedidos aún</p>';
                return;
            }
            
            contenedor.innerHTML = pedidos.map(p => `
                <div class="pedido-card">
                    <div class="header">
                        <span class="id">#${p.id}</span>
                        <span class="mesa">Mesa ${p.mesa}</span>
                    </div>
                    <div class="cliente">👤 ${p.nombreCliente}</div>
                    <ul class="articulos">
                        ${p.articulos.map(a => `<li>• ${a.nombre} x${a.cantidad}</li>`).join('')}
                    </ul>
                    <div class="total">Total: ${p.total.toFixed(2)}€</div>
                    <span class="estado ${p.estado}">${p.estado.replace('_', ' ')}</span>
                </div>
            `).join('');
        })
        .catch(() => {
            document.getElementById('lista-pedidos').innerHTML = '<p class="empty-msg">Error al cargar pedidos</p>';
        });
}
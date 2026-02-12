let carrito = [];
const API = 'http://localhost:8080/api';

// Emojis para cada plato
const EMOJIS = { 'Hamburguesa Deluxe': '🍔', 'Papas Fritas': '🍟', 'Refresco': '🥤', 'Pizza Margarita': '🍕' };

// Cargar menú al iniciar
document.addEventListener('DOMContentLoaded', () => {
    fetch(`${API}/menu`)
        .then(res => res.json())
        .then(platos => {
            const contenedor = document.getElementById('menu');
            platos.forEach(plato => {
                const emoji = EMOJIS[plato.nombre] || '🍽️';
                contenedor.innerHTML += `
                    <div class="plato-card">
                        <span class="emoji">${emoji}</span>
                        <h4>${plato.nombre}</h4>
                        <p class="desc">${plato.descripcion}</p>
                        <div class="card-footer">
                            <span class="precio">${plato.precio.toFixed(2)} €</span>
                            <button onclick="agregar('${plato.nombre}', ${plato.precio})">Añadir</button>
                        </div>
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

    if (vista === 'trabajador') cargarPedidos();
}

// Agregar artículo al carrito
function agregar(nombre, precio) {
    carrito.push({ nombre, precio, cantidad: 1, descripcion: "Pedido web" });
    actualizarCarrito();
    mostrarToast(`${nombre} añadido`);
}

function actualizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    lista.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        lista.innerHTML = '<li class="carrito-empty">Añade platos desde la carta</li>';
    } else {
        carrito.forEach((item, i) => {
            total += item.precio;
            lista.innerHTML += `
                <li>
                    <span>${item.nombre}</span>
                    <span>${item.precio.toFixed(2)} € <a href="#" onclick="quitar(${i}); return false;" style="color:var(--text-light);text-decoration:none;margin-left:8px;">✕</a></span>
                </li>`;
        });
    }

    document.getElementById('total').textContent = total.toFixed(2);
}

// Quitar artículo del carrito
function quitar(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

// Enviar pedido al servidor
function enviarPedido() {
    const nombre = document.getElementById('cliente').value.trim();
    const mesa = document.getElementById('mesa').value;

    if (!nombre || !mesa || carrito.length === 0) {
        mostrarToast('Completa nombre, mesa y añade algún plato');
        return;
    }

    fetch(`${API}/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreCliente: nombre, mesa: parseInt(mesa), articulos: carrito })
    })
    .then(res => res.json())
    .then(pedido => {
        carrito = [];
        document.getElementById('cliente').value = '';
        document.getElementById('mesa').value = '';

        // Mostrar confirmación dentro del contenedor del carrito
        const lista = document.getElementById('lista-carrito');
        lista.innerHTML = `
            <li class="confirmacion-pedido" style="flex-direction:column;align-items:center;text-align:center;padding:28px 10px;border:none;">
                <span style="font-size:2.2em;margin-bottom:10px;">✓</span>
                <strong style="font-size:1.05em;color:var(--text);">Pedido confirmado</strong>
                <span style="color:var(--text-light);font-size:0.88em;margin-top:6px;">
                    #${pedido.id} · Mesa ${pedido.mesa} · ${pedido.total.toFixed(2)} €
                </span>
                <span style="color:var(--text-light);font-size:0.82em;margin-top:4px;">
                    Tu pedido se está preparando
                </span>
                <a href="#" onclick="resetCarrito(); return false;"
                   style="margin-top:14px;color:var(--primary-dark);font-size:0.88em;text-decoration:none;font-weight:500;">
                    Hacer otro pedido
                </a>
            </li>`;
        document.getElementById('total').textContent = '0.00';
    })
    .catch(() => mostrarToast('Error conectando con el servidor'));
}

// Restaurar carrito tras confirmación
function resetCarrito() {
    actualizarCarrito();
}

// Cargar pedidos para el panel del trabajador
function cargarPedidos() {
    fetch(`${API}/pedidos`)
        .then(res => res.json())
        .then(pedidos => {
            const contenedor = document.getElementById('lista-pedidos');

            // Actualizar estadísticas
            document.getElementById('stat-total').textContent = pedidos.length;
            document.getElementById('stat-prep').textContent = pedidos.filter(p => p.estado === 'EN_PREPARACION').length;
            const mesasActivas = new Set(pedidos.map(p => p.mesa));
            document.getElementById('stat-mesas').textContent = mesasActivas.size;

            if (pedidos.length === 0) {
                contenedor.innerHTML = '<p class="empty-msg">No hay pedidos aún. Los pedidos aparecerán aquí en tiempo real.</p>';
                return;
            }

            contenedor.innerHTML = pedidos.map(p => `
                <div class="pedido-card">
                    <div class="header">
                        <span class="id">#${p.id}</span>
                        <span class="mesa">Mesa ${p.mesa}</span>
                    </div>
                    <ul class="articulos">
                        ${p.articulos.map(a => `<li>• ${a.nombre} ×${a.cantidad}</li>`).join('')}
                    </ul>
                    <div class="total-line">
                        <span class="estado ${p.estado}">${p.estado.replace(/_/g, ' ')}</span>
                        
                        ${p.estado !== 'ENTREGADO' ? 
                            `<button onclick="avanzarEstado(${p.id})" style="padding:5px 10px; font-size:0.8em; background:#eee; border:none; border-radius:5px; cursor:pointer;">
                                Avanzar ➡
                            </button>` 
                            : '<span style="color:green">✔ Completado</span>'}
                    </div>
                </div>
            `).join('');
        })
        .catch(() => {
            document.getElementById('lista-pedidos').innerHTML = '<p class="empty-msg">Error al cargar pedidos</p>';
        });
}

function avanzarEstado(id) {
    fetch(`${API}/pedido/${id}/avanzar`, { method: 'POST' })
        .then(res => {
            if(res.ok) cargarPedidos(); // Recargar la lista si todo fue bien
        });
}

// Notificación toast
function mostrarToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
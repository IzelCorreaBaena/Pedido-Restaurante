let carrito = [];
let pedidoActual = null; // Guarda el pedido confirmado para poder finalizarlo
const API = 'http://localhost:8080/api';

// Emojis para cada plato
const EMOJIS = { 'Hamburguesa Deluxe': '🍔', 'Papas Fritas': '🍟', 'Refresco': '🥤', 'Pizza Margarita': '🍕' };

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', () => {
    cargarMenu();
    cargarMesas();
});

function cargarMenu() {
    fetch(`${API}/menu`)
        .then(res => res.json())
        .then(platos => {
            const contenedor = document.getElementById('menu');
            contenedor.innerHTML = '';
            platos.forEach(plato => {
                const emoji = EMOJIS[plato.nombre] || '🍽️';
                contenedor.innerHTML += `
                    <div class="plato-card">
                        <span class="emoji">${emoji}</span>
                        <h4>${plato.nombre}</h4>
                        <p class="desc">${plato.descripcion}</p>
                        <div class="card-footer">
                            <span class="precio">${plato.precio.toFixed(2)} €</span>
                            <button onclick="agregar('${plato.nombre.replace(/'/g, "\\'")}', ${plato.precio})">Añadir</button>
                        </div>
                    </div>
                `;
            });
        });
}

function cargarMesas() {
    fetch(`${API}/mesas`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('mesa');
            select.innerHTML = '<option value="">Mesa</option>';
            for (let i = 1; i <= data.numMesas; i++) {
                select.innerHTML += `<option value="${i}">Mesa ${i}</option>`;
            }
        });
}

// ========== NAVEGACIÓN ==========

function cambiarVista(vista) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

    document.getElementById(`vista-${vista}`).classList.add('activa');
    document.getElementById(`btn-${vista}`).classList.add('active');

    if (vista === 'trabajador') {
        cargarPedidos();
        cargarNotificaciones();
    }
    if (vista === 'admin') {
        cargarAdminMenu();
        cargarAdminPedidos();
        cargarAdminMesas();
    }
    if (vista === 'cliente') {
        cargarMenu();
        cargarMesas();
    }
}

// ========== CARRITO (CLIENTE) ==========

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

function quitar(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

// ========== ENVIAR PEDIDO ==========

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
        pedidoActual = pedido;
        carrito = [];
        document.getElementById('cliente').value = '';
        document.getElementById('mesa').value = '';

        // Mostrar confirmación con botón de finalizar
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
                <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
                    <a href="#" onclick="abrirModalPago(); return false;"
                       style="background:var(--success);color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:500;font-size:0.9em;">
                        Finalizar y pagar
                    </a>
                    <a href="#" onclick="resetCarrito(); return false;"
                       style="color:var(--primary-dark);font-size:0.88em;text-decoration:none;font-weight:500;padding:10px 12px;">
                        Hacer otro pedido
                    </a>
                </div>
            </li>`;
        document.getElementById('total').textContent = '0.00';
    })
    .catch(() => mostrarToast('Error conectando con el servidor'));
}

function resetCarrito() {
    pedidoActual = null;
    actualizarCarrito();
}

// ========== FINALIZAR PEDIDO / PAGO ==========

function abrirModalPago() {
    if (!pedidoActual) {
        mostrarToast('No hay pedido activo');
        return;
    }
    document.getElementById('modal-total').textContent = pedidoActual.total.toFixed(2) + ' €';
    document.getElementById('modal-pago').classList.add('activo');
}

function cerrarModalPago() {
    document.getElementById('modal-pago').classList.remove('activo');
}

function confirmarPago(metodo) {
    if (!pedidoActual) return;

    fetch(`${API}/pedido/${pedidoActual.id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metodoPago: metodo })
    })
    .then(res => res.json())
    .then(data => {
        cerrarModalPago();

        // Bloquear pantalla
        const lockDetails = document.getElementById('lock-details');
        const metodoTexto = metodo === 'tarjeta' ? '💳 Tarjeta' : '💶 Efectivo';
        lockDetails.innerHTML = `
            Pedido <strong>#${pedidoActual.id}</strong> · Mesa <strong>${pedidoActual.mesa}</strong><br>
            Total: <strong>${pedidoActual.total.toFixed(2)} €</strong> · Pago: <strong>${metodoTexto}</strong>
        `;
        document.getElementById('lock-screen').classList.add('activo');

        pedidoActual = null;
    })
    .catch(() => mostrarToast('Error al solicitar la cuenta'));
}

function desbloquearPantalla() {
    document.getElementById('lock-screen').classList.remove('activo');
    resetCarrito();
}

// ========== PANEL TRABAJADOR ==========

function cargarPedidos() {
    fetch(`${API}/pedidos`)
        .then(res => res.json())
        .then(pedidos => {
            const contenedor = document.getElementById('lista-pedidos');

            // Estadísticas
            document.getElementById('stat-total').textContent = pedidos.length;
            document.getElementById('stat-prep').textContent = pedidos.filter(p => p.estado === 'EN_PREPARACION').length;
            const mesasActivas = new Set(pedidos.map(p => p.mesa));
            document.getElementById('stat-mesas').textContent = mesasActivas.size;
            document.getElementById('stat-cuentas').textContent = pedidos.filter(p => p.estado === 'CUENTA_PEDIDA').length;

            if (pedidos.length === 0) {
                contenedor.innerHTML = '<p class="empty-msg">No hay pedidos aún. Los pedidos aparecerán aquí en tiempo real.</p>';
                return;
            }

            contenedor.innerHTML = pedidos.map(p => {
                const estadoTexto = p.estado.replace(/_/g, ' ');
                const pagoInfo = p.metodoPago ? ` · ${p.metodoPago === 'tarjeta' ? '💳' : '💶'} ${p.metodoPago}` : '';
                return `
                <div class="pedido-card" style="border-left-color:${colorEstado(p.estado)}">
                    <div class="header">
                        <span class="id">#${p.id}</span>
                        <span class="mesa">Mesa ${p.mesa}</span>
                    </div>
<<<<<<< HEAD
=======
                    <div class="cliente">👤 ${p.nombreCliente}${pagoInfo}</div>
>>>>>>> 1450008f074474d675cf130f9b7147aaf4942397
                    <ul class="articulos">
                        ${p.articulos.map(a => `<li>• ${a.nombre} ×${a.cantidad}</li>`).join('')}
                    </ul>
                    <div class="total-line">
<<<<<<< HEAD
                        <span class="estado ${p.estado}">${p.estado.replace(/_/g, ' ')}</span>
                        
                        ${p.estado !== 'ENTREGADO' ? 
                            `<button onclick="avanzarEstado(${p.id})" style="padding:5px 10px; font-size:0.8em; background:#eee; border:none; border-radius:5px; cursor:pointer;">
                                Avanzar ➡
                            </button>` 
                            : '<span style="color:green">✔ Completado</span>'}
=======
                        <span class="estado ${p.estado}">${estadoTexto}</span>
                        <span class="total">${p.total.toFixed(2)} €</span>
>>>>>>> 1450008f074474d675cf130f9b7147aaf4942397
                    </div>
                    <div class="acciones">
                        ${p.estado === 'EN_PREPARACION' ? `<button onclick="cambiarEstadoPedido(${p.id}, 'LISTO_PARA_ENTREGAR')">Listo</button>` : ''}
                        ${p.estado === 'LISTO_PARA_ENTREGAR' ? `<button onclick="cambiarEstadoPedido(${p.id}, 'ENTREGADO')">Entregado</button>` : ''}
                        ${p.estado === 'CUENTA_PEDIDA' ? `<button onclick="cambiarEstadoPedido(${p.id}, 'PAGADO')">Marcar pagado</button>` : ''}
                        <button class="btn-danger" onclick="eliminarPedido(${p.id})">Eliminar</button>
                    </div>
                </div>
            `}).join('');
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
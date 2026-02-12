let carrito = [];
let pedidoActual = null; // Guarda el pedido confirmado para poder finalizarlo
const API = 'http://localhost:8080/api';

// Emojis para cada plato
const EMOJIS = { 'Hamburguesa Deluxe': '🍔', 'Papas Fritas': '🍟', 'Refresco': '🥤', 'Pizza Margarita': '🍕' };

// ========== INICIALIZACIÓN ==========

document.addEventListener('DOMContentLoaded', () => {
    // Detectamos en qué vista estamos para cargar lo necesario
    if(document.getElementById('vista-cliente').classList.contains('activa')) {
        cargarMenu();
        cargarMesas();
    } else if (document.getElementById('vista-trabajador').classList.contains('activa')) {
        cargarPedidos();
        cargarNotificaciones();
    }
});

function cargarMenu() {
    fetch(`${API}/menu`)
        .then(res => res.json())
        .then(platos => {
            const contenedor = document.getElementById('menu');
            if(contenedor) {
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
            }
        });
}

function cargarMesas() {
    fetch(`${API}/mesas`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('mesa');
            if(select) {
                select.innerHTML = '<option value="">Mesa</option>';
                for (let i = 1; i <= data.numMesas; i++) {
                    select.innerHTML += `<option value="${i}">Mesa ${i}</option>`;
                }
            }
        });
}

// ========== NAVEGACIÓN ==========

function cambiarVista(vista) {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));

    const vistaElem = document.getElementById(`vista-${vista}`);
    if(vistaElem) vistaElem.classList.add('activa');
    
    const btnElem = document.getElementById(`btn-${vista}`);
    if(btnElem) btnElem.classList.add('active');

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
    if(!lista) return;
    
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

    const totalElem = document.getElementById('total');
    if(totalElem) totalElem.textContent = total.toFixed(2);
}

function quitar(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

// ========== ENVIAR PEDIDO ==========

function enviarPedido() {
    const mesaElem = document.getElementById('mesa');
    if(!mesaElem) return;
    
    const mesa = mesaElem.value;
    
    // Generamos nombre automático si no hay input de cliente
    const clienteInput = document.getElementById('cliente');
    let nombre = clienteInput ? clienteInput.value.trim() : `Mesa ${mesa}`;
    if (!nombre) nombre = `Mesa ${mesa}`;

    if (!mesa || carrito.length === 0) {
        mostrarToast('Selecciona mesa y añade platos');
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
        if(clienteInput) clienteInput.value = '';
        mesaElem.value = '';

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
            if(!contenedor) return;

            // Estadísticas
            const statTotal = document.getElementById('stat-total');
            if(statTotal) statTotal.textContent = pedidos.length;
            
            const statPrep = document.getElementById('stat-prep');
            if(statPrep) statPrep.textContent = pedidos.filter(p => p.estado === 'EN_PREPARACION').length;
            
            const mesasActivas = new Set(pedidos.map(p => p.mesa));
            const statMesas = document.getElementById('stat-mesas');
            if(statMesas) statMesas.textContent = mesasActivas.size;
            
            const statCuentas = document.getElementById('stat-cuentas');
            if(statCuentas) statCuentas.textContent = pedidos.filter(p => p.estado === 'CUENTA_PEDIDA').length;

            if (pedidos.length === 0) {
                contenedor.innerHTML = '<p class="empty-msg">No hay pedidos aún. Los pedidos aparecerán aquí en tiempo real.</p>';
                return;
            }

            // AQUÍ ESTABA EL ERROR DE CONFLICTO. ESTA ES LA VERSIÓN CORREGIDA:
            contenedor.innerHTML = pedidos.map(p => {
                const estadoTexto = p.estado.replace(/_/g, ' ');
                const pagoInfo = p.metodoPago ? ` · ${p.metodoPago === 'tarjeta' ? '💳' : '💶'} ${p.metodoPago}` : '';
                
                return `
                <div class="pedido-card" style="border-left-color:${colorEstado(p.estado)}">
                    <div class="header">
                        <span class="id">#${p.id}</span>
                        <span class="mesa">Mesa ${p.mesa}</span>
                    </div>
                    
                    <div class="cliente">👤 ${p.nombreCliente}${pagoInfo}</div>
                    
                    <ul class="articulos">
                        ${p.articulos.map(a => `<li>• ${a.nombre} ×${a.cantidad}</li>`).join('')}
                    </ul>
                    
                    <div class="total-line">
                        <span class="estado ${p.estado}">${estadoTexto}</span>
                        <span class="total">${p.total.toFixed(2)} €</span>
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
            const contenedor = document.getElementById('lista-pedidos');
            if(contenedor) contenedor.innerHTML = '<p class="empty-msg">Error al cargar pedidos</p>';
        });
}


function avanzarEstado(id) {
    fetch(`${API}/pedido/${id}/avanzar`, { method: 'POST' })
        .then(res => {
            if(res.ok) cargarPedidos(); 
        });
}

function colorEstado(estado) {
    const colores = {
        'EN_PREPARACION': '#f39c12',
        'LISTO_PARA_ENTREGAR': '#3498db',
        'ENTREGADO': '#27ae60',
        'CUENTA_PEDIDA': '#e74c3c',
        'PAGADO': '#17a2b8'
    };
    return colores[estado] || '#6b9edd';
}

function cambiarEstadoPedido(id, nuevoEstado) {
    fetch(`${API}/pedido/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(() => {
        cargarPedidos();
        mostrarToast('Estado actualizado');
    });
}

function eliminarPedido(id) {
    if (!confirm('¿Eliminar este pedido?')) return;
    fetch(`${API}/pedido/${id}`, { method: 'DELETE' })
        .then(() => {
            cargarPedidos();
            mostrarToast('Pedido eliminado');
        });
}

// ========== NOTIFICACIONES DE PAGO (TRABAJADOR) ==========

function cargarNotificaciones() {
    fetch(`${API}/notificaciones`)
        .then(res => res.json())
        .then(notifs => {
            const contenedor = document.getElementById('notificaciones-pago');
            if(!contenedor) return;

            if (notifs.length === 0) {
                contenedor.innerHTML = '';
                return;
            }
            contenedor.innerHTML = notifs.map((n, i) => {
                const metodoIcon = n.metodoPago === 'tarjeta' ? '💳' : '💶';
                return `
                <div class="notif-banner">
                    <span class="notif-text">
                        ${metodoIcon} <strong>Mesa ${n.mesa}</strong> (${n.cliente}) ha pedido la cuenta de
                        <strong>${n.total.toFixed(2)} €</strong> en <strong>${n.metodoPago}</strong>
                    </span>
                    <button onclick="descartarNotificacion(${i})">Atendido ✓</button>
                </div>
            `}).join('');
        });
}

function descartarNotificacion(index) {
    fetch(`${API}/notificacion/${index}`, { method: 'DELETE' })
        .then(() => {
            cargarNotificaciones();
            cargarPedidos();
            mostrarToast('Notificación descartada');
        });
}

// Polling automático
setInterval(() => {
    const vistaTrabajador = document.getElementById('vista-trabajador');
    if (vistaTrabajador && vistaTrabajador.classList.contains('activa')) {
        cargarNotificaciones();
        cargarPedidos();
    }
}, 5000);

// ========== PANEL ADMIN ==========

function cargarAdminMenu() {
    fetch(`${API}/menu`)
        .then(res => res.json())
        .then(articulos => {
            const tbody = document.getElementById('admin-menu-body');
            if(!tbody) return;

            if (articulos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);">No hay artículos</td></tr>';
                return;
            }
            tbody.innerHTML = articulos.map((a, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${a.nombre}</td>
                    <td>${a.descripcion}</td>
                    <td><strong>${a.precio.toFixed(2)} €</strong></td>
                    <td class="actions">
                        <button onclick="editarArticuloAdmin(${i}, '${a.nombre.replace(/'/g, "\\'")}', '${a.descripcion.replace(/'/g, "\\'")}', ${a.precio})">Editar</button>
                        <button class="del" onclick="eliminarArticuloAdmin(${i})">Eliminar</button>
                    </td>
                </tr>
            `).join('');
        });
}

function agregarArticuloAdmin() {
    const nombreElem = document.getElementById('art-nombre');
    const descElem = document.getElementById('art-desc');
    const precioElem = document.getElementById('art-precio');
    
    const nombre = nombreElem.value.trim();
    const desc = descElem.value.trim();
    const precio = parseFloat(precioElem.value);

    if (!nombre || !precio || precio <= 0) {
        mostrarToast('Completa nombre y precio correctamente');
        return;
    }

    fetch(`${API}/admin/articulo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, cantidad: 1, descripcion: desc || 'Sin descripción', precio })
    })
    .then(res => res.json())
    .then(() => {
        nombreElem.value = '';
        descElem.value = '';
        precioElem.value = '';
        cargarAdminMenu();
        mostrarToast('Artículo añadido al menú');
    });
}

function editarArticuloAdmin(index, nombre, desc, precio) {
    const nuevoNombre = prompt('Nombre:', nombre);
    if (nuevoNombre === null) return;
    const nuevaDesc = prompt('Descripción:', desc);
    if (nuevaDesc === null) return;
    const nuevoPrecio = prompt('Precio (€):', precio);
    if (nuevoPrecio === null) return;

    const precioNum = parseFloat(nuevoPrecio);
    if (!nuevoNombre || isNaN(precioNum) || precioNum <= 0) {
        mostrarToast('Datos inválidos');
        return;
    }

    fetch(`${API}/admin/articulo/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre, cantidad: 1, descripcion: nuevaDesc || 'Sin descripción', precio: precioNum })
    })
    .then(res => res.json())
    .then(() => {
        cargarAdminMenu();
        mostrarToast('Artículo actualizado');
    });
}

function eliminarArticuloAdmin(index) {
    if (!confirm('¿Eliminar este artículo del menú?')) return;
    fetch(`${API}/admin/articulo/${index}`, { method: 'DELETE' })
        .then(() => {
            cargarAdminMenu();
            mostrarToast('Artículo eliminado');
        });
}

function cargarAdminPedidos() {
    fetch(`${API}/pedidos`)
        .then(res => res.json())
        .then(pedidos => {
            const tbody = document.getElementById('admin-pedidos-body');
            const emptyMsg = document.getElementById('admin-pedidos-empty');
            if(!tbody) return;

            if (pedidos.length === 0) {
                tbody.innerHTML = '';
                if(emptyMsg) emptyMsg.style.display = 'block';
                return;
            }
            if(emptyMsg) emptyMsg.style.display = 'none';

            tbody.innerHTML = pedidos.map(p => {
                const estadoTexto = p.estado.replace(/_/g, ' ');
                const pagoInfo = p.metodoPago || '—';
                return `
                <tr>
                    <td>#${p.id}</td>
                    <td>${p.nombreCliente}</td>
                    <td>Mesa ${p.mesa}</td>
                    <td><span class="estado ${p.estado}" style="font-size:0.78em;">${estadoTexto}</span></td>
                    <td><strong>${p.total.toFixed(2)} €</strong></td>
                    <td>${pagoInfo}</td>
                    <td class="actions">
                        <button onclick="adminCambiarEstado(${p.id})">Estado</button>
                        <button class="del" onclick="adminEliminarPedido(${p.id})">Eliminar</button>
                    </td>
                </tr>
            `}).join('');
        });
}

function adminCambiarEstado(id) {
    const estado = prompt('Nuevo estado:\n1) EN_PREPARACION\n2) LISTO_PARA_ENTREGAR\n3) ENTREGADO\n4) CUENTA_PEDIDA\n5) PAGADO');
    const estados = { '1': 'EN_PREPARACION', '2': 'LISTO_PARA_ENTREGAR', '3': 'ENTREGADO', '4': 'CUENTA_PEDIDA', '5': 'PAGADO' };
    const nuevoEstado = estados[estado] || estado;

    if (!nuevoEstado || !Object.values(estados).includes(nuevoEstado)) {
        mostrarToast('Estado no válido');
        return;
    }

    fetch(`${API}/pedido/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(() => {
        cargarAdminPedidos();
        mostrarToast('Estado actualizado');
    });
}

function adminEliminarPedido(id) {
    if (!confirm('¿Eliminar este pedido?')) return;
    fetch(`${API}/pedido/${id}`, { method: 'DELETE' })
        .then(() => {
            cargarAdminPedidos();
            mostrarToast('Pedido eliminado');
        });
}

function cargarAdminMesas() {
    fetch(`${API}/mesas`)
        .then(res => res.json())
        .then(data => {
            const inputMesas = document.getElementById('admin-num-mesas');
            if(inputMesas) inputMesas.value = data.numMesas;
        });
}

function guardarMesas() {
    const numMesas = parseInt(document.getElementById('admin-num-mesas').value);
    if (isNaN(numMesas) || numMesas < 1) {
        mostrarToast('Número de mesas inválido');
        return;
    }

    fetch(`${API}/admin/mesas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numMesas })
    })
    .then(res => res.json())
    .then(() => {
        mostrarToast(`Mesas actualizadas a ${numMesas}`);
    });
}

// ========== UTILIDADES ==========

function mostrarToast(msg) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
# 🍽️ Pedido Restaurante

Sistema web de gestión de pedidos para restaurantes con tres roles diferenciados: **cliente**, **trabajador de cocina** y **administrador**.

---

## ✨ Características

### 👤 Vista Cliente
- Selección de mesa y registro de nombre
- Carta interactiva con categorías, descripción y precio
- Añadir artículos al pedido con un clic
- Solicitar la cuenta y elegir método de pago (efectivo o tarjeta)
- Resumen del pedido con subtotal, IGIC (7%) y total

### 👨‍🍳 Vista Cocina (Trabajador)
- Panel en tiempo real de todos los pedidos activos
- Cambio de estado: `En preparación → Listo para entregar → Entregado`
- Notificaciones de cuentas solicitadas con método de pago
- Actualización automática cada 5 segundos

### 🛠️ Vista Administración
- Gestión completa del menú (añadir, editar, eliminar artículos)
- Configuración del número de mesas del restaurante
- Historial de pedidos pagados del día
- Estadísticas diarias: ventas totales, número de pedidos y métodos de pago
- Limpieza del historial

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Java 21 + Spring Boot 4.0 |
| API | REST (Spring MVC) |
| Persistencia | JSON (ficheros locales) |
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Build | Maven |

---

## 🚀 Cómo ejecutar

### Requisitos
- Java 21+
- Maven 3.8+

### Pasos

```bash
# Clona el repositorio
git clone https://github.com/izelcorreabaena/pedido-restaurante.git
cd pedido-restaurante/demo

# Ejecuta la aplicación
mvn spring-boot:run
```

Abre el navegador en: [http://localhost:8080](http://localhost:8080)

---

## 📡 API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/menu` | Obtener carta del restaurante |
| `GET` | `/api/mesas` | Número de mesas disponibles |
| `GET` | `/api/pedidos` | Listar pedidos activos |
| `POST` | `/api/pedido` | Crear o añadir artículos a un pedido |
| `POST` | `/api/pedido/{id}/avanzar` | Avanzar estado del pedido |
| `PUT` | `/api/pedido/{id}/estado` | Cambiar estado manualmente |
| `POST` | `/api/pedido/{id}/pagar` | Solicitar la cuenta |
| `DELETE` | `/api/pedido/{id}` | Eliminar un pedido |
| `GET` | `/api/admin/historial` | Historial de pedidos pagados |
| `GET` | `/api/admin/historial/hoy` | Resumen estadístico del día |
| `POST` | `/api/admin/articulo` | Añadir artículo al menú |
| `PUT` | `/api/admin/articulo/{index}` | Editar artículo del menú |
| `DELETE` | `/api/admin/articulo/{index}` | Eliminar artículo del menú |
| `PUT` | `/api/admin/mesas` | Cambiar número de mesas |

---

## 📁 Estructura del proyecto

```
demo/
├── src/
│   └── main/
│       ├── java/com/JoaIzl/demo/
│       │   ├── DemoApplication.java       # Punto de entrada
│       │   ├── RestauranteController.java # Controlador REST
│       │   ├── Pedido.java                # Entidad pedido
│       │   ├── Articulo.java              # Entidad artículo (record)
│       │   └── EstadoPedido.java          # Estados del pedido (enum)
│       └── resources/
│           └── static/
│               ├── index.html             # SPA principal
│               ├── styles.css             # Estilos
│               └── script.js             # Lógica frontend
└── pom.xml
```

---

## 🔄 Flujo de un pedido

```
Cliente hace pedido
       ↓
  EN_PREPARACIÓN
       ↓ (cocina avanza)
LISTO_PARA_ENTREGAR
       ↓ (cocina avanza)
    ENTREGADO
       ↓ (cliente pide cuenta)
  CUENTA_PEDIDA
       ↓ (admin confirma pago)
     PAGADO → Historial
```

---

## 👨‍💻 Autor

Proyecto desarrollado como práctica de desarrollo web full-stack con Spring Boot y JavaScript vanilla.

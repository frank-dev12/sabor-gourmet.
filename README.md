# Sabor Gourmet

Sistema de gestión para el restaurante **Sabor Gourmet**: inventario de productos, pedidos con descuento automático de stock y reservas de mesas sin cruces de horario.

| Parte | Tecnología | Carpeta | Puerto |
|---|---|---|---|
| Backend (API REST) | Java 21, Spring Boot 4.1, Spring Data JPA, Hibernate 7 | `/` (raíz) | `8080` |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 | `frontend/` | `3000` |
| Base de datos | MariaDB 11 (compatible con MySQL 8) | — | `3306` |

---

## Índice

1. [Requisitos](#requisitos)
2. [Puesta en marcha rápida](#puesta-en-marcha-rápida)
3. [Configuración](#configuración)
4. [Arquitectura del backend](#arquitectura-del-backend)
5. [Modelo de datos](#modelo-de-datos)
6. [Reglas de negocio](#reglas-de-negocio)
7. [Referencia de la API](#referencia-de-la-api)
8. [Manejo de errores](#manejo-de-errores)
9. [Frontend](#frontend)
10. [Pruebas](#pruebas)
11. [Notas sobre MariaDB](#notas-sobre-mariadb)
12. [Solución de problemas](#solución-de-problemas)

---

## Requisitos

- **JDK 21** y **Maven 3.9+**
- **Node.js 20.9+** (probado con Node 26 LTS) y npm
- **MariaDB 11** o **MySQL 8** corriendo en `localhost:3306`

> En este equipo Node.js está instalado en `~/.local/opt/node`. Para tenerlo disponible en la terminal, agrega a `~/.bashrc`:
>
> ```bash
> export PATH="$HOME/.local/opt/node/bin:$PATH"
> ```

---

## Puesta en marcha rápida

### 1. Base de datos

La base `sabor_gourmet` debe existir y el usuario configurado debe tener permisos sobre ella. Las tablas las crea Hibernate automáticamente al arrancar (`ddl-auto=update`).

```sql
CREATE DATABASE IF NOT EXISTS sabor_gourmet;
```

### 2. Backend

```bash
mvn spring-boot:run
```

La API queda disponible en `http://localhost:8080/api`.

### 3. Frontend

```bash
cd frontend
npm install        # solo la primera vez
npm run dev
```

La interfaz queda disponible en `http://localhost:3000`.

### Ejecutar ambos en segundo plano

```bash
# desde la raíz del proyecto
nohup mvn -B spring-boot:run > /tmp/sg-back.log 2>&1 &
(cd frontend && nohup npm run dev > /tmp/sg-front.log 2>&1 &)

# detenerlos
pkill -f SaborGourmetApplication; pkill -f "next dev"
```

### Compilar para producción

```bash
mvn clean package                 # genera target/sabor-gourmet-backend-0.0.1-SNAPSHOT.jar
java -jar target/sabor-gourmet-backend-0.0.1-SNAPSHOT.jar

cd frontend && npm run build && npm start
```

---

## Configuración

### Backend — `src/main/resources/application.properties`

| Propiedad | Valor actual | Descripción |
|---|---|---|
| `spring.datasource.url` | `jdbc:mysql://localhost:3306/sabor_gourmet?useSSL=false&serverTimezone=UTC` | Conexión JDBC |
| `spring.datasource.username` | `${DB_USERNAME:winter}` | Usuario (sobrescribible por variable de entorno) |
| `spring.datasource.password` | `${DB_PASSWORD:}` | Contraseña (vacía por defecto) |
| `spring.jpa.database-platform` | `org.hibernate.dialect.MariaDBDialect` | Dialecto fijo (ver [Notas sobre MariaDB](#notas-sobre-mariadb)) |
| `spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access` | `false` | Evita una consulta de metadatos incompatible con MariaDB |
| `spring.jpa.hibernate.ddl-auto` | `update` | Crea/actualiza tablas al arrancar |
| `spring.jpa.open-in-view` | `false` | Las entidades no salen de la capa de servicio |
| `spring.jpa.show-sql` | `true` | Muestra el SQL en consola (desactivar en producción) |
| `app.cors.allowed-origins` | `${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}` | Orígenes permitidos por CORS, separados por coma |

Variables de entorno soportadas:

```bash
DB_USERNAME=otro_usuario DB_PASSWORD=secreto \
CORS_ALLOWED_ORIGINS=https://mi-dominio.com \
mvn spring-boot:run
```

> Para producción se recomienda cambiar `ddl-auto` a `validate` y gestionar el esquema con migraciones (Flyway o Liquibase).

### Frontend — `frontend/.env.local`

| Variable | Por defecto | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api` | URL base de la API |

Copia `frontend/.env.example` como `frontend/.env.local` si necesitas cambiarla. Al ser una variable `NEXT_PUBLIC_`, su valor se fija al compilar (`npm run build`).

---

## Arquitectura del backend

Arquitectura en capas (MVC) bajo el paquete `com.saborgourmet`:

```
src/main/java/com/saborgourmet/
├── SaborGourmetApplication.java   Punto de entrada
├── config/        CorsConfig: CORS global para /api/**
├── controller/    Controladores REST: reciben DTOs y delegan en servicios
├── dto/           Records de entrada (…Request, con validaciones) y salida (…Response)
├── exception/     Excepciones de dominio + GlobalExceptionHandler (respuestas ProblemDetail)
├── model/         Entidades JPA y enums
├── repository/    Interfaces Spring Data JPA (consultas derivadas, JPQL y bloqueos)
└── service/       Interfaces de servicio + impl/ con la lógica de negocio transaccional
```

Flujo de una petición:

```
HTTP → Controller (@Valid DTO) → Service (@Transactional, reglas de negocio) → Repository → BD
                                         ↓
                              Response DTO ← Entidad
```

Decisiones relevantes:

- **DTOs en la frontera**: los controladores nunca exponen entidades JPA; así se evitan ciclos de serialización y cargas *lazy* fuera de transacción.
- **Bloqueo pesimista** (`SELECT … FOR UPDATE`) sobre productos al crear/editar/cancelar pedidos y sobre la mesa al reservar. Evita condiciones de carrera: dos pedidos simultáneos no pueden vender la última unidad, ni dos reservas simultáneas ocupar la misma mesa. Los productos se bloquean ordenados por id para evitar *deadlocks*.
- **Borrado lógico** de productos y mesas (`activo = false`): los pedidos y reservas históricos siguen referenciándolos.
- **Precio congelado**: cada línea de pedido guarda el precio unitario del momento; cambiar el precio de un producto no altera pedidos existentes.
- **Enums como `VARCHAR`** (`@JdbcTypeCode(SqlTypes.VARCHAR)`): evita que `ddl-auto=update` reescriba las columnas `ENUM` en cada arranque y facilita añadir valores nuevos.

---

## Modelo de datos

```
productos 1 ───< detalles_pedido >─── 1 pedidos
mesas     1 ───< reservas
```

| Tabla | Campos principales |
|---|---|
| `productos` | `id`, `nombre` (único), `descripcion`, `categoria`, `precio`, `stock`, `activo` |
| `pedidos` | `id`, `nombre_cliente`, `tipo`, `numero_mesa`, `direccion_entrega`, `metodo_pago`, `estado`, `observaciones`, `total`, `fecha_creacion`, `fecha_actualizacion` |
| `detalles_pedido` | `id`, `pedido_id`, `producto_id`, `cantidad`, `precio_unitario` |
| `mesas` | `id`, `numero` (único), `capacidad`, `ubicacion`, `activa` |
| `reservas` | `id`, `mesa_id`, `nombre_cliente`, `telefono`, `numero_personas`, `fecha_hora_inicio`, `fecha_hora_fin`, `estado`, `observaciones`, `fecha_creacion` |

Enumeraciones:

| Enum | Valores |
|---|---|
| `CategoriaProducto` | `ENTRADA`, `PLATO_FUERTE`, `ACOMPANAMIENTO`, `POSTRE`, `BEBIDA` |
| `TipoPedido` | `EN_MESA`, `PARA_LLEVAR`, `DOMICILIO` |
| `MetodoPago` | `EFECTIVO`, `TRANSFERENCIA`, `BILLETERA_DIGITAL` (solo DOMICILIO) |
| `EstadoPedido` | `PENDIENTE`, `EN_PREPARACION`, `LISTO`, `ENTREGADO`, `CANCELADO` |
| `EstadoReserva` | `CONFIRMADA`, `COMPLETADA`, `CANCELADA` |

Las fechas se manejan como `LocalDateTime` sin zona horaria, con formato ISO: `2026-12-20T20:00:00`.

---

## Reglas de negocio

### Inventario

- El nombre del producto es único (sin distinguir mayúsculas).
- Un ajuste de stock nunca puede dejarlo en negativo.
- `DELETE` desactiva el producto: deja de poder pedirse, pero se conserva en el historial.

### Pedidos y stock

- El cliente envía solo `productoId` y `cantidad`; **el precio lo toma el backend** del producto.
- Si un mismo producto aparece en varias líneas, se agrupan y se valida la cantidad total.
- Al **crear**: se valida que todos los productos existan, estén activos y tengan stock suficiente. Si alguno falla, se rechaza el pedido completo (409) listando todos los faltantes, y **no se toca el inventario**.
- Al **editar** (solo en estado `PENDIENTE`): se devuelve el stock de las líneas anteriores y se descuenta el de las nuevas.
- Al **cancelar**: se repone el stock.
- Al **eliminar**: solo pedidos `PENDIENTE` (repone stock) o `CANCELADO` (ya repuesto).
- `ENTREGADO` y `CANCELADO` son estados finales: no admiten más cambios.
- Los pedidos `EN_MESA` exigen `numeroMesa`; en los demás tipos se ignora.
- Los pedidos `DOMICILIO` exigen `direccionEntrega` y `metodoPago` (`EFECTIVO`, `TRANSFERENCIA` o `BILLETERA_DIGITAL` — Yape/Plin). En los demás tipos se ignoran.

### Reservas

- **Sin cruces de horario**: dos reservas `CONFIRMADA` de la misma mesa no pueden solaparse. Los intervalos son semiabiertos `[inicio, fin)`: una reserva que termina a las 20:00 **no** choca con otra que empieza a las 20:00.
- Las reservas `CANCELADA` o `COMPLETADA` liberan el horario.
- La mesa debe estar activa y tener capacidad para el número de personas.
- La fecha de inicio debe ser futura y el fin posterior al inicio.
- Solo se editan reservas `CONFIRMADA`; al editar no se considera cruce consigo misma.
- No se puede desactivar una mesa con reservas confirmadas pendientes.

---

## Referencia de la API

URL base: `http://localhost:8080/api`. Todas las peticiones y respuestas son JSON. Las creaciones devuelven `201 Created` con la cabecera `Location`.

### Productos — `/api/productos`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/productos?categoria=BEBIDA&disponibles=true` | Lista productos. Filtros opcionales: `categoria`; `disponibles=true` devuelve solo activos con stock > 0 |
| `GET` | `/api/productos/{id}` | Detalle |
| `POST` | `/api/productos` | Crea un producto |
| `PUT` | `/api/productos/{id}` | Actualiza un producto |
| `PATCH` | `/api/productos/{id}/stock` | Ajusta stock: `{"cantidad": 10}` repone, `{"cantidad": -2}` descuenta |
| `DELETE` | `/api/productos/{id}` | Desactiva (borrado lógico) → `204` |

```bash
curl -X POST localhost:8080/api/productos -H 'Content-Type: application/json' -d '{
  "nombre": "Lomo saltado",
  "categoria": "PLATO_FUERTE",
  "precio": 32.50,
  "stock": 20,
  "descripcion": "Lomo fino salteado al wok"
}'
```

### Pedidos — `/api/pedidos`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/pedidos?estado=PENDIENTE` | Lista pedidos (más recientes primero), filtro opcional por estado |
| `GET` | `/api/pedidos/{id}` | Detalle |
| `POST` | `/api/pedidos` | Crea un pedido y descuenta stock |
| `PUT` | `/api/pedidos/{id}` | Edita un pedido `PENDIENTE` y recalcula stock |
| `PATCH` | `/api/pedidos/{id}/estado` | Cambia el estado: `{"estado": "EN_PREPARACION"}` |
| `DELETE` | `/api/pedidos/{id}` | Elimina un pedido `PENDIENTE` o `CANCELADO` → `204` |

```bash
curl -X POST localhost:8080/api/pedidos -H 'Content-Type: application/json' -d '{
  "nombreCliente": "Ana Torres",
  "tipo": "EN_MESA",
  "numeroMesa": 4,
  "observaciones": "Sin cebolla",
  "items": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 6, "cantidad": 1 }
  ]
}'

# Pedido a domicilio (dirección y método de pago obligatorios)
curl -X POST localhost:8080/api/pedidos -H 'Content-Type: application/json' -d '{
  "nombreCliente": "Luis Díaz",
  "tipo": "DOMICILIO",
  "direccionEntrega": "Av. Principal 123, Dpto 401",
  "metodoPago": "BILLETERA_DIGITAL",
  "items": [{ "productoId": 1, "cantidad": 1 }]
}'
```

Respuesta (resumida):

```json
{
  "id": 1,
  "nombreCliente": "Ana Torres",
  "tipo": "EN_MESA",
  "numeroMesa": 4,
  "estado": "PENDIENTE",
  "items": [
    { "id": 1, "productoId": 1, "nombreProducto": "Lomo saltado", "cantidad": 2, "precioUnitario": 32.50, "subtotal": 65.00 },
    { "id": 2, "productoId": 6, "nombreProducto": "Chicha morada", "cantidad": 1, "precioUnitario": 8.00, "subtotal": 8.00 }
  ],
  "total": 73.00,
  "fechaCreacion": "2026-11-14T19:31:00",
  "fechaActualizacion": "2026-11-14T19:31:00"
}
```

### Mesas — `/api/mesas`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/mesas?soloActivas=true` | Lista mesas ordenadas por número |
| `GET` | `/api/mesas/disponibles?inicio=…&fin=…&personas=4` | Mesas activas con capacidad suficiente y sin reservas en ese rango (ordenadas por capacidad) |
| `GET` | `/api/mesas/{id}` | Detalle |
| `POST` | `/api/mesas` | Crea una mesa: `{"numero": 5, "capacidad": 4, "ubicacion": "Terraza"}` |
| `PUT` | `/api/mesas/{id}` | Actualiza una mesa |
| `DELETE` | `/api/mesas/{id}` | Desactiva (falla con 409 si tiene reservas futuras) → `204` |

```bash
curl "localhost:8080/api/mesas/disponibles?inicio=2026-12-20T20:00:00&fin=2026-12-20T22:00:00&personas=4"
```

### Reservas — `/api/reservas`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/reservas?fecha=2026-12-20&mesaId=2` | Reservas de un día (por defecto hoy), filtro opcional por mesa |
| `GET` | `/api/reservas/{id}` | Detalle |
| `POST` | `/api/reservas` | Crea una reserva validando cruces y capacidad |
| `PUT` | `/api/reservas/{id}` | Edita una reserva `CONFIRMADA` |
| `PATCH` | `/api/reservas/{id}/estado` | `{"estado": "CANCELADA"}` o `{"estado": "COMPLETADA"}` |

```bash
curl -X POST localhost:8080/api/reservas -H 'Content-Type: application/json' -d '{
  "mesaId": 2,
  "nombreCliente": "Luis Pérez",
  "telefono": "999888777",
  "numeroPersonas": 4,
  "fechaHoraInicio": "2026-12-20T20:00:00",
  "fechaHoraFin": "2026-12-20T22:00:00"
}'
```

---

## Manejo de errores

Los errores siguen el estándar **RFC 9457 (`ProblemDetail`)** con `Content-Type: application/problem+json`.

| Código | Cuándo |
|---|---|
| `400 Bad Request` | Validación fallida, JSON mal formado, parámetro con formato inválido |
| `404 Not Found` | El recurso (producto, pedido, mesa, reserva) no existe |
| `409 Conflict` | Regla de negocio incumplida: stock insuficiente, cruce de horario, estado que no admite el cambio, duplicados |

Ejemplo de stock insuficiente:

```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "Stock insuficiente: 'Ají de gallina': solicitado 5, disponible 1",
  "instance": "/api/pedidos"
}
```

Ejemplo de cruce de horario:

```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "La mesa 2 ya está reservada en ese horario: 2026-12-20 20:00 a 2026-12-20 22:00",
  "instance": "/api/reservas"
}
```

Los errores de validación incluyen el detalle por campo en `errores`:

```json
{
  "status": 400,
  "detail": "Datos inválidos",
  "errores": {
    "nombreCliente": "no debe estar vacío",
    "items": "no debe estar vacío"
  }
}
```

---

## Frontend

Interfaz web en `frontend/` con tres vistas, accesibles desde la barra superior:

| Ruta | Vista | Funcionalidad |
|---|---|---|
| `/` | Panel | Accesos a los tres módulos |
| `/inventario` | Inventario | Alta de productos, filtro por categoría y "solo con stock", ajuste rápido de stock (±), desactivar. Indicadores de stock bajo (≤ 5) y agotado. Tabla en escritorio y tarjetas en móvil (< 768 px) |
| `/pedidos` | Pedidos | Nuevo pedido con tarjetas de productos, carrito con cantidades y total en vivo. Lista de pedidos filtrable por estado, con botones para avanzar el estado o cancelar |
| `/reservas` | Reservas | Flujo en 3 pasos: buscar mesas libres (fecha, hora, duración, personas) → elegir mesa → confirmar. Agenda del día con completar/cancelar. Gestión de mesas del salón |

### Estructura

```
frontend/src/
├── app/                       Rutas (App Router): layout, páginas y loading
│   ├── inventario/page.tsx
│   ├── pedidos/page.tsx
│   └── reservas/{page,loading}.tsx
├── components/
│   ├── layout/AppHeader.tsx   Navegación principal
│   ├── ui/                    Componentes base: Button, Card, Field, Badge, Alert, States, PageHeader
│   ├── inventario/            InventarioView, ProductoForm, ProductosTable, ProductoCards, AjusteStock, StockBadge
│   ├── pedidos/               PedidosView, NuevoPedidoForm, ProductoPicker, Carrito, PedidoCard
│   └── reservas/              ReservasView, NuevaReserva, ReservaItem, MesasPanel
├── hooks/useApiData.ts        Carga de datos con recarga, sin parpadeo
└── lib/
    ├── api/                   Cliente HTTP por recurso (productos, pedidos, mesas, reservas)
    ├── types.ts               Tipos TypeScript equivalentes a los DTOs del backend
    ├── labels.ts              Textos en español y colores de cada estado/categoría
    └── format.ts              Formato de moneda y fechas
```

Convenciones:

- Cada página (`app/*/page.tsx`) es un Server Component mínimo que renderiza una vista cliente (`*View.tsx`), que orquesta los datos y compone componentes pequeños.
- `lib/api/client.ts` convierte las respuestas `ProblemDetail` en `ApiError`; `describeError()` genera el mensaje que se muestra al usuario.
- Las fechas del backend se tratan como texto para evitar desfases de zona horaria.
- La moneda se formatea en `lib/format.ts` (`formatMoney`); cámbiala ahí si se necesita otro símbolo.

### Scripts

```bash
npm run dev     # servidor de desarrollo en :3000
npm run build   # build de producción
npm start       # sirve el build de producción
npm run lint    # ESLint
```

---

## Pruebas

### Backend

```bash
mvn test
```

Las pruebas son de integración (`@SpringBootTest` + MockMvc) y usan **H2 en memoria**, por lo que no necesitan la base de datos real (`src/test/resources/application.properties`).

| Clase | Qué verifica |
|---|---|
| `PedidoControllerTest` | Descuento y reposición de stock al crear/cancelar/editar/eliminar; rechazo por stock insuficiente sin modificar inventario; productos inactivos o inexistentes; validaciones; 404 |
| `ReservaControllerTest` | Cruces de horario (incluye horarios contiguos permitidos); edición sin chocar consigo misma; capacidad; rango horario inválido; búsqueda de mesas disponibles |
| `CorsConfigTest` | Preflight aceptado desde `localhost:3000` y `localhost:5173`; rechazado desde otros orígenes |

### Frontend

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

---

## Notas sobre MariaDB

El servidor local es **MariaDB 11.8**, no MySQL. Esto obliga a dos ajustes, ya aplicados en `application.properties`:

1. **Dialecto explícito `MariaDBDialect`** con `allow_jdbc_metadata_access=false`. El driver MySQL Connector/J consulta la columna `INFORMATION_SCHEMA.KEYWORDS.RESERVED`, que no existe en MariaDB; sin el dialecto fijo, Hibernate no puede arrancar (*"Unable to determine Dialect without JDBC metadata"*).
2. **No usar `MySQLDialect`**: genera `SELECT … FOR UPDATE OF <alias>` (sintaxis de MySQL 8) que MariaDB rechaza, lo que rompe los bloqueos de stock y de reservas.

Si se migra a **MySQL 8**, basta con cambiar a:

```properties
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

Al arrancar aparece el aviso `HHH90000025: MariaDBDialect does not need to be specified explicitly`. Es esperado e inofensivo: el dialecto sí es necesario porque la autodetección está desactivada.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Unable to determine Dialect without JDBC metadata` | Falta el dialecto explícito con MariaDB | Revisa [Notas sobre MariaDB](#notas-sobre-mariadb) |
| `Access denied for user` | Credenciales incorrectas | Ajusta `DB_USERNAME` / `DB_PASSWORD` |
| `Communications link failure` | MariaDB no está corriendo | `sudo systemctl start mariadb` |
| `Port 8080 was already in use` | Otra instancia del backend sigue activa | `pkill -f SaborGourmetApplication` |
| El frontend muestra "No se pudo conectar con el servidor" | Backend apagado o URL distinta | Levanta el backend o ajusta `NEXT_PUBLIC_API_URL` |
| Error de CORS en el navegador | El origen del frontend no está permitido | Agrégalo a `CORS_ALLOWED_ORIGINS` |
| `node: command not found` | Node no está en el `PATH` | `export PATH="$HOME/.local/opt/node/bin:$PATH"` |
| Al reservar: "debe ser una fecha futura" | Se eligió una hora ya pasada | Selecciona una hora posterior a la actual |

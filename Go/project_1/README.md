# Mayu - Sistema Web de Gestión y Reserva de Ambientes Universitarios

Aplicación web desarrollada en **Go** (Gin + SQLite) con **frontend estático** (HTML, CSS y JavaScript vanilla).

Mayu permite gestionar ambientes universitarios (aulas, laboratorios y salas de estudio) y
administrar las reservas de los estudiantes, evitando horarios superpuestos.

## Requisitos

- Go 1.21 o superior ([go.dev/dl](https://go.dev/dl/))

## Ejecución

```bash
cd Go/project_1
go run .
```

- Frontend: http://localhost:3000/
- API: http://localhost:3000/api/ambientes

> **Importante:** no uses "Open With Live Server" de VS Code. Live Server solo sirve archivos
> estáticos y no ejecuta la API de Go (por eso aparece un error de servidor inválido).
> La app completa (frontend + API) se sirve desde `go run .` en la terminal.

Variables opcionales: `PORT` (puerto, por defecto 3000) y `MAYU_DB` (ruta de la base de datos, por defecto `data/mayu.db`).

La base de datos SQLite se crea automáticamente en `data/mayu.db` junto con datos de ejemplo
(7 ambientes y 2 usuarios) en el primer arranque.

## Roles y acceso

| Usuario | Contraseña | Rol | Permisos |
|---|---|---|---|
| `admin` | `admin123` | Administrador | CRUD de ambientes, ve todas las reservas, estadísticas |
| `estudiante` | `estudiante123` | Estudiante | Consulta ambientes (solo lectura), reserva y gestiona solo las suyas |

- Sesión mediante **cookie HttpOnly firmada (HMAC-SHA256)**, válida 7 días; contraseñas con **bcrypt**.
- Las contraseñas se guardan hasheadas en la BD (`users`).
- Un estudiante siempre reserva con **su propio código** y no puede ver, modificar ni cancelar
  reservas de otros (403).
- Todos los endpoints (excepto `login`) devuelven **401** sin sesión y **403** si el rol no alcanza.

## Estructura del proyecto

```
project_1/
├── main.go            # Punto de entrada: rutas, middlewares y servidor
├── config/            # Configuración (puerto, ruta de la BD)
├── db/                # Conexión a SQLite, migración y datos semilla
├── models/            # Modelos de datos (Ambiente, Reserva)
├── store/             # Capa de acceso a datos (consultas SQL)
├── handlers/          # Controladores (validaciones y respuestas)
├── middlewares/       # Logger, recuperación de panics y 404 JSON
├── utils/             # Validaciones de fechas, horas, códigos y enums
├── data/              # Base de datos SQLite (generada, no se commitea)
└── public/            # Frontend estático (index.html, style.css, script.js)
```

## Endpoints de la API

Formato de respuesta:

```json
{ "status": "success", "data": ... }
{ "status": "fail", "message": "..." }
```

Todos requieren sesión (cookie `mayu_session`), salvo `login` y `logout`.
**A** = solo admin.

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | `{usuario, password}` → crea la sesión |
| POST | `/api/auth/logout` | Elimina la sesión |
| GET | `/api/auth/me` | Usuario actual (401 si no hay sesión) |

### Ambientes

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/ambientes` | todos | Listar (filtros: `q`, `tipo`, `estado`, `capacidad_min`, `edificio`) |
| GET | `/api/ambientes/:id` | todos | Obtener uno por ID |
| POST | `/api/ambientes` | **A** | Registrar ambiente |
| PUT | `/api/ambientes/:id` | **A** | Actualizar ambiente |
| DELETE | `/api/ambientes/:id` | **A** | Eliminar (bloquea si tiene reservas activas) |

### Disponibilidad

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/disponibilidad` | Ambientes libres. Requiere `fecha`, `hora_inicio`, `hora_fin`; opcionales `tipo`, `capacidad_min` |

### Reservas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reservas` | Listar (filtros: `fecha`, `ambiente_id`, `estado`, `codigo`). El estudiante solo ve las suyas |
| GET | `/api/reservas/:id` | Obtener una por ID |
| POST | `/api/reservas` | Registrar (el estudiante queda asociado a su código) |
| PUT | `/api/reservas/:id` | Modificar (solo dueño o admin) |
| PATCH | `/api/reservas/:id/cancelar` | Cancelar (solo dueño o admin) |

### Estadísticas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/estadisticas` | **A** | Totales, ambientes por tipo, uso (horas) y reservas por fecha |

## Reglas de negocio

- **Sin reservas superpuestas**: solo puede existir una reserva *activa* por ambiente con
  horarios que se pisen en la misma fecha (las horarias adyacentes sí están permitidas).
- **Horario de operación**: 06:00 a 22:00, inicio menor que fin.
- **Fechas**: formato `YYYY-MM-DD` y no anteriores a hoy.
- **Ambientes en mantenimiento** no pueden recibir reservas ni ser reservados.
- **Código de estudiante**: 4 a 20 caracteres (letras, números o guiones).
- **Estados de reserva**: `activa`, `cancelada` (cancelar dos veces responde 409).

## Ejemplo con curl

```bash
# Iniciar sesión (guarda la cookie en el archivo jar)
curl -c jar.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin123"}'

# Listar laboratorios con capacidad mínima 25
curl -b jar.txt "http://localhost:3000/api/ambientes?tipo=laboratorio&capacidad_min=25"

# Consultar disponibilidad
curl -b jar.txt "http://localhost:3000/api/disponibilidad?fecha=2026-11-20&hora_inicio=08:00&hora_fin=10:00"

# Registrar una reserva
curl -b jar.txt -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{"ambiente_id":1,"estudiante":"Ana Torres","codigo":"202412345","fecha":"2026-11-20","hora_inicio":"08:00","hora_fin":"10:00","motivo":"Clase"}'
```

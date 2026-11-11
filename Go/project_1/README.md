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

Variables opcionales: `PORT` (puerto, por defecto 3000) y `MAYU_DB` (ruta de la base de datos, por defecto `data/mayu.db`).

La base de datos SQLite se crea automáticamente en `data/mayu.db` junto con datos de ejemplo
(7 ambientes) en el primer arranque.

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

### Ambientes

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/ambientes` | Listar (filtros: `q`, `tipo`, `estado`, `capacidad_min`, `edificio`) |
| GET | `/api/ambientes/:id` | Obtener uno por ID |
| POST | `/api/ambientes` | Registrar ambiente |
| PUT | `/api/ambientes/:id` | Actualizar ambiente |
| DELETE | `/api/ambientes/:id` | Eliminar (bloquea si tiene reservas activas) |

### Disponibilidad

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/disponibilidad` | Ambientes libres. Requiere `fecha`, `hora_inicio`, `hora_fin`; opcionales `tipo`, `capacidad_min` |

### Reservas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reservas` | Listar (filtros: `fecha`, `ambiente_id`, `estado`, `codigo`) |
| GET | `/api/reservas/:id` | Obtener una por ID |
| POST | `/api/reservas` | Registrar reserva (valida solapamiento) |
| PUT | `/api/reservas/:id` | Modificar reserva |
| PATCH | `/api/reservas/:id/cancelar` | Cancelar reserva |

### Estadísticas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/estadisticas` | Totales, ambientes por tipo, uso (horas) y reservas por fecha |

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
# Listar laboratorios con capacidad mínima 25
curl "http://localhost:3000/api/ambientes?tipo=laboratorio&capacidad_min=25"

# Consultar disponibilidad
curl "http://localhost:3000/api/disponibilidad?fecha=2026-11-20&hora_inicio=08:00&hora_fin=10:00"

# Registrar una reserva
curl -X POST http://localhost:3000/api/reservas \
  -H "Content-Type: application/json" \
  -d '{"ambiente_id":1,"estudiante":"Ana Torres","codigo":"202412345","fecha":"2026-11-20","hora_inicio":"08:00","hora_fin":"10:00","motivo":"Clase"}'
```

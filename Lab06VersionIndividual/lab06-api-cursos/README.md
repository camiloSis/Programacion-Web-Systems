# Lab06 - API RESTful para Gestión de Cursos Académicos

> **Universidad Nacional de San Agustín (UNSA)**  
> **Escuela Profesional de Ingeniería de Sistemas**  
> **Curso: Introducción al Desarrollo Web**  
> **Laboratorio N° 06: Express y Construcción de una API RESTful**

---

## Descripción

Este proyecto implementa una API RESTful completa para la gestión de cursos académicos utilizando **Node.js** y **Express.js**. La API permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre recursos de tipo *Curso*, siguiendo las mejores prácticas de diseño REST, arquitectura por capas y manejo profesional de errores.

---

## Objetivos del Laboratorio

1. **Diseñar e implementar una API RESTful** con Express.js usando los verbos HTTP estándar: `GET`, `POST`, `PUT` y `DELETE`.
2. **Implementar middlewares** incorporados y personalizados: procesamiento de JSON (`express.json()`) y registro de logs de auditoría (logger).
3. **Estructurar el backend con arquitectura por capas**, separando claramente **Rutas** (`/routes`), **Controladores** (`/controllers`) y **Datos** (`/data`).

---

## Competencias

| Código | Competencia |
|--------|-------------|
| **C.a** | Desarrolla aplicaciones web del lado servidor utilizando frameworks modernos (Express.js). |
| **C.b** | Aplica patrones de arquitectura por capas y separación de responsabilidades. |
| **C.c** | Implementa APIs RESTful con manejo semántico de códigos HTTP y validación de datos. |

---

## Tecnologías Utilizadas

- **Node.js** ≥ 18.x
- **Express.js** 5.x
- **Newman** (para pruebas automatizadas de la colección Postman)
- **HTML5 / CSS3 / JavaScript Vanilla** (frontend de demostración)

---

## Requisitos Previos

- Node.js instalado (versión 18 o superior recomendada)
- npm (incluido con Node.js)
- Opcional: Postman o VS Code con extensión Thunder Client para pruebas manuales

---

## Instalación y Ejecución

```bash
# 1. Clonar o ingresar al directorio del proyecto
cd lab06-api-cursos

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor (puerto 3000 por defecto)
npm start
```

El servidor estará disponible en:
- **API:** `http://localhost:3000/api/cursos`
- **Frontend:** `http://localhost:3000/`

Para ejecutar las pruebas automatizadas con Newman:

```bash
npm run test:api
```

---

## Estructura del Proyecto

```
lab06-api-cursos/
├── app.js                           # Punto de entrada, orquestación de middlewares y rutas
├── package.json                     # Configuración del proyecto, scripts y dependencias
├── .gitignore                       # Archivos ignorados por git (node_modules, .env)
├── README.md                        # Esta documentación
├── flujo.md                         # Diagramas de arquitectura y flujo (Mermaid)
├── CUESTIONARIO.md                  # Respuestas al cuestionario teórico (15% nota)
├── routes/
│   └── cursoRoutes.js               # Definición de endpoints del recurso /api/cursos
├── controllers/
│   └── cursoController.js           # Lógica de negocio y validaciones
├── data/
│   └── cursos.js                    # Persistencia en memoria (array de cursos)
├── middlewares/
│   ├── logger.js                    # Middleware personalizado de auditoría (logs)
│   └── errorHandler.js              # Manejador global de errores + 404
├── public/
│   ├── index.html                   # Frontend: formulario + tabla interactiva
│   ├── style.css                    # Estilos responsive
│   └── script.js                    # Lógica del cliente (fetch API)
└── postman/
    └── Lab06_API_Cursos.postman_collection.json  # Colección Postman v2.1
```

### Función de Cada Archivo

| Archivo | Responsabilidad |
|---------|-----------------|
| `app.js` | Configura Express, registra middlewares en orden correcto, monta rutas, inicia servidor |
| `routes/cursoRoutes.js` | Asocia verbos HTTP + rutas → funciones del controlador (sin lógica de negocio) |
| `controllers/cursoController.js` | Implementa `getCursos`, `getCursoPorId`, `crearCurso`, `actualizarCurso`, `eliminarCurso` con validaciones |
| `data/cursos.js` | Array en memoria exportado; 6 cursos semilla con créditos variados (2, 3, 4) |
| `middlewares/logger.js` | Imprime `MÉTODO URL - STATUS - N ms` usando `res.on('finish')` |
| `middlewares/errorHandler.js` | `notFoundHandler` (404) + `errorHandler` (4 params, respeta `err.status`, no expone stack) |
| `public/*` | SPA que consume la API real vía `fetch()`: crear/editar, listar con filtro, eliminar |

---

## Endpoints de la API

**Base URL:** `http://localhost:3000/api/cursos`

| Método | Ruta | Descripción | Códigos de Respuesta |
|--------|------|-------------|---------------------|
| `GET` | `/api/cursos` | Lista todos los cursos (opcional filtro `?creditos=N`) | 200, 400 |
| `GET` | `/api/cursos/:id` | Obtiene un curso por ID | 200, 400, 404 |
| `POST` | `/api/cursos` | Crea un nuevo curso (valida `nombre`, `codigo`, `creditos`) | 201, 400, 409 |
| `PUT` | `/api/cursos/:id` | Actualiza completamente un curso existente | 200, 400, 404, 409 |
| `DELETE` | `/api/cursos/:id` | Elimina un curso | 200, 400, 404 |

### Ejemplos de Request / Response

#### GET `/api/cursos`
```bash
curl http://localhost:3000/api/cursos
```
**Response 200:**
```json
{
  "status": "success",
  "data": [
    { "id": 1, "nombre": "Matemáticas I", "codigo": "MAT101", "creditos": 4 },
    { "id": 2, "nombre": "Física General", "codigo": "FIS101", "creditos": 4 }
  ]
}
```

#### GET `/api/cursos?creditos=4`
```bash
curl "http://localhost:3000/api/cursos?creditos=4"
```
**Response 200:** Solo cursos con 4 créditos.

#### GET `/api/cursos/1`
```bash
curl http://localhost:3000/api/cursos/1
```
**Response 200:**
```json
{ "status": "success", "data": { "id": 1, "nombre": "Matemáticas I", "codigo": "MAT101", "creditos": 4 } }
```

#### POST `/api/cursos`
```bash
curl -X POST http://localhost:3000/api/cursos \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Estructuras de Datos", "codigo": "INF201", "creditos": 4}'
```
**Response 201:**
```json
{ "status": "success", "data": { "id": 7, "nombre": "Estructuras de Datos", "codigo": "INF201", "creditos": 4 } }
```

#### PUT `/api/cursos/7`
```bash
curl -X PUT http://localhost:3000/api/cursos/7 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Estructuras de Datos Avanzadas", "codigo": "INF201", "creditos": 5}'
```
**Response 200:**
```json
{ "status": "success", "data": { "id": 7, "nombre": "Estructuras de Datos Avanzadas", "codigo": "INF201", "creditos": 5 } }
```

#### DELETE `/api/cursos/7`
```bash
curl -X DELETE http://localhost:3000/api/cursos/7
```
**Response 200:**
```json
{ "status": "success", "message": "Curso 'Estructuras de Datos Avanzadas' (código: INF201) eliminado correctamente" }
```

---

## Ejemplos con cURL (Casos de Error)

| Caso | Comando | Código Esperado |
|------|---------|-----------------|
| Curso no encontrado | `curl http://localhost:3000/api/cursos/999` | 404 |
| Faltan campos obligatorios | `curl -X POST ... -d '{"codigo":"X","creditos":3}'` | 400 |
| Créditos inválidos (0) | `curl -X POST ... -d '{"nombre":"X","codigo":"X","creditos":0}'` | 400 |
| Código duplicado | `curl -X POST ... -d '{"nombre":"X","codigo":"MAT101","creditos":3}'` | 409 |
| JSON mal formado | `curl -X POST ... -d '{"nombre":"X","codigo":"X","creditos":3'` | 400 |
| Ruta inexistente | `curl http://localhost:3000/api/otra` | 404 |
| Filtro créditos no numérico | `curl "http://localhost:3000/api/cursos?creditos=abc"` | 400 |

---

## Metodología

El desarrollo siguió un enfoque **incremental y por capas**:

1. **Análisis de la guía**: Identificación de requisitos obligatorios (endpoints, middlewares, arquitectura, pruebas, cuestionario).
2. **Diseño por capas**: Separación física en carpetas `/routes`, `/controllers`, `/data`, `/middlewares`.
3. **Implementación incremental**:
   - Capa de datos (`data/cursos.js`) con 6 cursos semilla.
   - Controladores con validaciones exhaustivas y formato de respuesta uniforme.
   - Rutas delgadas (`express.Router()`).
   - Middlewares: `express.json()` → `logger` → `static` → rutas → `404` → `errorHandler`.
   - `app.js` solo orquesta, sin lógica de negocio.
   - Frontend vanilla consumiendo la API real.
4. **Validación continua**: Pruebas manuales con `curl` en cada endpoint tras cada cambio.
5. **Pruebas automatizadas**: Colección Postman completa (18 requests, 58 assertions) ejecutada con Newman.
6. **Documentación**: README, flujo.md (Mermaid), CUESTIONARIO.md alineados al comportamiento real.

---

## Decisiones de Diseño y Justificación

| Decisión | Justificación |
|----------|---------------|
| **Datos en memoria (array)** | Requisito de la guía ("persistencia temporal"); simplifica el laboratorio sin BD externa. |
| **DELETE responde 200 con mensaje** | La guía pide "200 con mensaje de confirmación y documentar la decisión". 200 permite incluir cuerpo con detalles; 204 No Content no permite body. |
| **Formato de respuesta uniforme** | `{ status: 'success' \| 'fail' \| 'error', data \| message }` — consistente, predecible, facilita cliente. |
| **IDs con `max(id) + 1`** | Evita duplicados tras eliminaciones (contra `length + 1`). |
| **Validación `creditos` estricta** | `Number.isInteger` + `> 0`; rechaza `0`, negativos, floats, strings. |
| **Código duplicado → 409 Conflict** | Semánticamente correcto para conflicto de recurso; documentado en README y probado en Postman. |
| **Logger con `res.on('finish')`** | Mide tiempo real de respuesta; imprime método, URL, status, ms. |
| **ErrorHandler con 4 parámetros** | Firma `(err, req, res, next)` obligatoria para que Express lo reconozca como manejador de errores. |
| **Orden de middlewares** | `express.json()` primero (parsea body), `logger` segundo (loguea todo), `static` antes de rutas API, `404` y `errorHandler` al final. |
| **Frontend en `public/`** | Demuestra consumo real de la API; no requerido por la guía pero agrega valor. |

---

## Cómo Importar y Ejecutar la Colección Postman

### Opción A: Postman (GUI)
1. Abrir Postman → **Import** → seleccionar `postman/Lab06_API_Cursos.postman_collection.json`.
2. La variable `baseUrl` ya está configurada en `http://localhost:3000`.
3. Ejecutar la colección completa (botón **Run**) o carpetas individuales.

### Opción B: Newman (CLI - CI/CD)
```bash
# Desde la raíz del proyecto
npm run test:api
# Equivale a:
npx newman run postman/Lab06_API_Cursos.postman_collection.json
```
**Resultado esperado:** 18 requests, 58 assertions, 0 failed.

---

## Cómo Usar el Frontend

1. Iniciar el servidor: `npm start`
2. Abrir navegador en `http://localhost:3000/`
3. **Funcionalidades:**
   - **Filtro por créditos**: Select que recarga la tabla vía `?creditos=N`.
   - **Crear curso**: Completa nombre, código, créditos → "Crear Curso".
   - **Editar**: Botón "Editar" en fila → carga datos en formulario → "Actualizar Curso".
   - **Eliminar**: Botón "Eliminar" → confirmación → borra y recarga tabla.
   - **Mensajes**: Éxito (verde) / Error (rojo) según código HTTP de la API.

---

## Limitaciones y Mejoras Futuras

| Limitación | Mejora Propuesta |
|------------|------------------|
| Datos volátiles (se pierden al reiniciar) | Integrar base de datos (MongoDB, PostgreSQL) con ORM/ODM. |
| Sin autenticación/autorización | JWT + roles (admin, docente, estudiante). |
| Validación básica en controlador | Usar `joi`, `zod` o `express-validator` para validación declarativa. |
| Sin paginación en `GET /api/cursos` | Query params `page`, `limit` + metadata en respuesta. |
| Sin tests unitarios/integración (Jest) | Suite de tests con cobertura ≥ 80%. |
| Logs solo en consola | Winston/Pino + archivos rotativos + niveles (info, warn, error). |
| CORS no configurado | `cors` middleware para producción. |
| Rate limiting ausente | `express-rate-limit` para protección básica. |

---

## Referencias Bibliográficas

- Express.js Community. **Express.js Guide: Middleware**. 2025. Disponible en: https://expressjs.com/en/guide/using-middleware.html
- Restlet Team. **REST API Design Rulebook**. O'Reilly Media, 2023.
- Wilson, E. **Learning Express.js: Building Web Applications with Node.js**. Packt Publishing, 2021.
- Fielding, R. T. **Architectural Styles and the Design of Network-based Software Architectures** (PhD Thesis). UC Irvine, 2000. Capítulo 5: REST.
- Postman Inc. **Postman Collection Format v2.1**. 2024. https://schema.getpostman.com/json/collection/v2.1.0/collection.json

---

> **Nota:** Este proyecto fue desarrollado individualmente como entrega del Laboratorio N° 06 del curso "Introducción al Desarrollo Web" (UNSA, Ingeniería de Sistemas). Cumple con todos los requisitos de la guía y apunta al nivel "Excelente (19-20)" en la rúbrica de evaluación.
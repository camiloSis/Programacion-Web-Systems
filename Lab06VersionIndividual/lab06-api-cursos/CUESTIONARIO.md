# CUESTIONARIO - Lab06 API RESTful con Express

> Respuestas a las 3 preguntas obligatorias de la guía (15% de la nota).
> Basadas en el código real del proyecto `lab06-api-cursos`.

---

## Pregunta 1: ¿Qué es un Middleware en Express y cuál es el impacto de no invocar `next()`?

### Definición

Un **Middleware** en Express es una función que tiene acceso al objeto de petición (`req`), al objeto de respuesta (`res`) y a la función `next` del ciclo de petición-respuesta de la aplicación. Los middlewares se ejecutan **secuencialmente** en el orden en que se registran (`app.use()` o `router.use()`).

Pueden:
- Ejecutar código arbitrario.
- Modificar `req` y `res`.
- Finalizar el ciclo de petición-respuesta (enviando respuesta).
- Llamar a `next()` para pasar el control al siguiente middleware.
- Llamar a `next(err)` para saltar al manejador de errores.

### Firma típica
```javascript
function miMiddleware(req, res, next) {
  // ... lógica
  next(); // pasa al siguiente
}
```

Para manejo de errores (4 parámetros obligatorios):
```javascript
function errorHandler(err, req, res, next) { ... }
```

### Impacto de NO invocar `next()`

| Escenario | Consecuencia |
|-----------|--------------|
| **Middleware normal** (`app.use`, `router.use`) | La petición **se queda colgada** ("hangs"). El cliente no recibe respuesta y espera hasta **timeout** (por defecto 2 min en Node/Express, configurable en cliente). El servidor no procesa más middlewares ni rutas para esa petición. |
| **Middleware de error** (`err, req, res, next`) | El error no se propaga; si no se responde, igual queda colgado. |
| **Dentro de ruta/controlador** (`app.get(...)`) | Equivalente a no enviar respuesta: el cliente espera indefinidamente. |

### Ejemplo real en el proyecto

**`middlewares/logger.js`** — registra tiempo de respuesta usando `res.on('finish')`:
```javascript
function logger(req, res, next) {
  const inicio = Date.now();
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duracion} ms`);
  });
  next(); // ← CRÍTICO: sin esto, la petición nunca llega al controlador
}
module.exports = logger;
```

**`middlewares/errorHandler.js`** — manejador global (4 params):
```javascript
function errorHandler(err, req, res, next) {
  console.error('Error no controlado:', err);
  // ... responde 500 o err.status
}
```
Registrado **al final** en `app.js`:
```javascript
app.use(notFoundHandler);  // 404
app.use(errorHandler);     // 500 / err.status
```

### Si se olvida `next()` en `logger`:
```
Cliente: POST /api/cursos  →  [express.json]  →  [logger]  →  🛑 SE DETIENE AQUÍ
                                                                   │
                                                           No llama next()
                                                           Controlador NUNCA se ejecuta
                                                           Cliente: timeout tras 120s
```

---

## Pregunta 2: Diferencia de propósito semántico y de implementación entre `req.params`, `req.query` y `req.body`

### Tabla Comparativa

| Característica | `req.params` | `req.query` | `req.body` |
|----------------|--------------|-------------|------------|
| **Propósito semántico** | Identificar un **recurso específico** en la URL (parte de la ruta). | **Filtrar, paginar, ordenar** colecciones (parámetros opcionales). | Enviar **datos del recurso** a crear/actualizar (payload). |
| **Origen** | Parámetros de ruta (`:id` en `/api/cursos/:id`). | Query string (`?creditos=4` en `/api/cursos?creditos=4`). | Cuerpo de la petición (JSON, form-data, etc.). |
| **Disponibilidad** | Siempre `string` (Express los parsea de la URL). | Siempre `string` (Express los parsea de la URL). | `undefined` salvo que use `express.json()` / `express.urlencoded()`. |
| **Casos de uso REST** | `GET /recursos/:id`, `PUT /recursos/:id`, `DELETE /recursos/:id` | `GET /recursos?page=1&limit=10&orden=nombre` | `POST /recursos`, `PUT /recursos/:id`, `PATCH /recursos/:id` |
| **Validación típica** | Existencia, formato (numérico, UUID), permisos. | Tipado, rangos, valores permitidos, sanitización. | Esquema completo (requeridos, tipos, longitudes, unicidad). |

### Ejemplos del Proyecto

#### `req.params` — Identificar recurso único
```javascript
// routes/cursoRoutes.js
router.get('/:id', cursoController.getCursoPorId);

// controllers/cursoController.js
function getCursoPorId(req, res) {
  const id = Number(req.params.id);  // "1" → 1
  if (isNaN(id)) return res.status(400).json({...});
  const curso = cursos.find(c => c.id === id);
  // ...
}
```
**Petición real:** `GET /api/cursos/1` → `req.params = { id: "1" }`

---

#### `req.query` — Filtrar colección
```javascript
// controllers/cursoController.js
function getCursos(req, res) {
  const { creditos } = req.query;  // "4" → string
  if (creditos !== undefined) {
    const creditosNum = Number(creditos);
    if (isNaN(creditosNum) || !Number.isInteger(creditosNum) || creditosNum <= 0) {
      return res.status(400).json({ status: 'fail', message: 'entero positivo' });
    }
    const filtrados = cursos.filter(c => c.creditos === creditosNum);
    return res.json({ status: 'success', data: filtrados });
  }
  // ...
}
```
**Petición real:** `GET /api/cursos?creditos=4` → `req.query = { creditos: "4" }`

---

#### `req.body` — Datos del recurso (requiere `express.json()`)
```javascript
// app.js (orden importante!)
app.use(express.json());  // ← HABILITA req.body para JSON

// controllers/cursoController.js
function crearCurso(req, res) {
  const { nombre, codigo, creditos } = req.body;  // Objeto parseado
  // validaciones...
}
```
**Petición real:**
```http
POST /api/cursos HTTP/1.1
Content-Type: application/json

{"nombre":"Redes","codigo":"INF301","creditos":3}
```
→ `req.body = { nombre: "Redes", codigo: "INF301", creditos: 3 }`

---

### Resumen Visual

```
URL:  GET  /api/cursos/1?creditos=4
       │        │        │
       │        │        └─ req.query = { creditos: "4" }
       │        └─ req.params = { id: "1" }
       └─ (req.body = undefined en GET)

URL:  POST /api/cursos
Body: {"nombre":"X","codigo":"Y","creditos":3}
       │
       └─ req.body = { nombre: "X", codigo: "Y", creditos: 3 }
       (req.params = {}, req.query = {})
```

---

## Pregunta 3: ¿Por qué es fundamental devolver códigos HTTP semánticos (200, 201, 400, 404, 500) en lugar de responder siempre 200 OK?

### Respuesta Corta

Porque **HTTP es el contrato de la API**. Los códigos de estado comunican **el resultado de la operación** a **clientes automatizados**, **cachés**, **proxies**, **herramientas de monitoreo** y **desarrolladores** sin necesidad de parsear el cuerpo JSON. Responder siempre 200 rompe la semántica del protocolo, impide automatización confiable y obliga a clientes a inspeccionar el body para saber si hubo éxito o error.

---

### Justificación Detallada

#### 1. **Clientes Automatizados y CI/CD**
- Scripts, tests, pipelines CI/CD, webhooks, SDKs generados (OpenAPI/Swagger) **leen el status code** para decidir flujo: reintentar, fallar build, alertar, hacer rollback.
- Ejemplo: `pm.response.to.have.status(201)` en Postman/Newman valida creación exitosa. Si todo fuera 200, el test pasaría aunque el cuerpo diga `"status": "fail"`.

#### 2. **Cachés HTTP (RFC 7234)**
- **200/201** → Cacheable (con headers `Cache-Control`, `ETag`).
- **404** → Cacheable (evita golpear servidor por recurso inexistente).
- **400/500** → No cacheable (errores no deben cachearse).
- **Si usas 200 para errores**: Un proxy/CDN podría cachear la respuesta de error y servirla a otros clientes como si fuera éxito.

#### 3. **Depuración y Observabilidad**
- Logs de acceso (nginx, Apache, AWS ALB, Cloudflare) registran status code.
- Dashboards (Grafana, Datadog, New Relic) alertan por **tasa de 5xx** o **4xx**.
- Sin códigos semánticos: **ciega la monitorización**. No puedes distinguir "tráfico normal" de "fallos masivos".

#### 4. **Contrato de API y Documentación (OpenAPI/Swagger)**
- Especificación OpenAPI 3.x **requiere** mapear cada response a su código HTTP.
- Generadores de clientes (TypeScript, Java, Python, Go) crean **tipos diferenciados** por status:
  ```typescript
  // Generado automáticamente si especifica 201 vs 400 vs 404
  async createCurso(data): Promise<Curso>;        // 201
  async createCurso(data): Promise<ValidationError>; // 400
  async createCurso(data): Promise<ConflictError>;   // 409
  ```

#### 5. **Comportamiento de Navegadores y Herramientas**
- `fetch()` **no rechaza** en 4xx/5xx (solo en error de red), pero `axios` y `ky` **sí** si configuras `validateStatus`.
- `curl -f` (fail) retorna exit code ≠ 0 en 4xx/5xx → útil en scripts bash.
- Service Workers / PWA: estrategias de cache dependen de status codes.

#### 6. **Semántica REST (Fielding, 2000)**
| Código | Significado REST | Uso en este proyecto |
|--------|------------------|---------------------|
| **200** | OK — Representación del recurso | GET lista, GET by id, PUT, DELETE (con mensaje) |
| **201** | Created — Recurso creado + Location | POST exitoso |
| **400** | Bad Request — Error del cliente (datos inválidos) | JSON malformed, campos faltantes, créditos inválidos |
| **404** | Not Found — Recurso no existe | GET/PUT/DELETE por ID inexistente, ruta inexistente |
| **409** | Conflict — Conflicto de estado (duplicado) | Código de curso repetido |
| **500** | Internal Server Error — Fallo del servidor | Excepción no capturada (bug) |

---

### Ejemplo Práctico: ¿Qué pasa si todo es 200?

```javascript
// ❌ MAL: Siempre 200
app.post('/api/cursos', (req, res) => {
  if (!req.body.nombre) {
    return res.status(200).json({ ok: false, error: 'Falta nombre' });
  }
  // ...
  res.status(200).json({ ok: true, data: curso });
});
```

**Consecuencias reales:**
1. **Newman/Postman:** `pm.response.to.have.status(201)` → **FALSO** (recibe 200).
2. **Frontend `fetch`:** `response.ok` es `true` → entra en `.then()`, no en `.catch()`. Debes hacer `if (!data.ok) throw ...` manualmente en **cada** llamada.
3. **CDN/Proxy:** Cachea el error como respuesta válida.
4. **Monitoreo:** Gráficas de "éxito" (2xx) muestran 100% aunque la API falle.
5. **Cliente generado:** Asume éxito, intenta acceder a `data.id` → `undefined` → crash en runtime.

---

### Buena Práctica en el Proyecto

Todos los controladores usan **formato uniforme** con códigos semánticos:

```javascript
// Éxito
res.status(200).json({ status: 'success', data: ... });   // GET, PUT, DELETE
res.status(201).json({ status: 'success', data: ... });   // POST

// Error cliente (4xx)
res.status(400).json({ status: 'fail', message: '...' }); // Validación
res.status(404).json({ status: 'fail', message: '...' }); // No encontrado
res.status(409).json({ status: 'fail', message: '...' }); // Conflicto

// Error servidor (5xx) — solo via errorHandler
res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
```

Esto permite al frontend hacer:
```javascript
const response = await fetch('/api/cursos', { method: 'POST', ... });
if (!response.ok) {
  const err = await response.json();
  throw new Error(err.message);  // 400, 404, 409, 500 entran aquí
}
const { data } = await response.json();  // 200, 201 entran aquí
```

---

## Conclusión

| Pregunta | Concepto Clave |
|----------|----------------|
| **1. Middleware** | Función en la cadena `req → res`; **`next()` es obligatorio** para continuar; sin él, **petición cuelga hasta timeout**. |
| **2. req.params/query/body** | **Params**: identificar recurso (`/cursos/:id`); **Query**: filtrar colecciones (`?creditos=4`); **Body**: payload crear/actualizar (requiere `express.json()`). |
| **3. Códigos HTTP** | **Contrato máquina-a-máquina**: automatización, caché, monitoreo, documentación, depuración. **200 para todo rompe la web**. |

---

> **Referencias del proyecto:**
> - `middlewares/logger.js:1-11` — Middleware con `next()` y `res.on('finish')`
> - `middlewares/errorHandler.js:1-25` — Error handler 4 parámetros + 404 handler
> - `controllers/cursoController.js:27-46` — `req.params` en GET by id
> - `controllers/cursoController.js:3-25` — `req.query` en GET lista con filtro
> - `controllers/cursoController.js:69-91` — `req.body` en POST con validaciones
> - `app.js:8-18` — Orden de middlewares: `json → logger → static → routes → 404 → errorHandler`
# Flujo de la Aplicación - Lab06 API Cursos

> Documentación visual de la arquitectura, ciclos de petición-respuesta y flujos de decisión.
> Los diagramas usan **Mermaid** y son renderizables directamente en GitHub/GitLab/VS Code.

---

## 1. Arquitectura por Capas

```mermaid
graph TB
    subgraph CAPA_CLIENTE["CAPA CLIENTE"]
        UI[Frontend public/index.html]
        API_CLIENT[Postman curl fetch]
    end

    subgraph CAPA_MIDDLEWARES["CAPA MIDDLEWARES app.js"]
        direction TB
        MW1[1. express.json - Parse req.body]
        MW2[2. logger.js - Audit log + timing]
        MW3[3. express.static - Sirve public]
    end

    subgraph CAPA_RUTAS["CAPA RUTAS"]
        ROUTER[cursoRoutes.js - express.Router]
    end

    subgraph CAPA_CONTROLADORES["CAPA CONTROLADORES"]
        CTRL[cursoController.js - Logica de negocio + validaciones]
    end

    subgraph CAPA_DATOS["CAPA DATOS"]
        DATA[(data/cursos.js - Array en memoria)]
    end

    subgraph CAPA_ERRORES["CAPA MANEJO ERRORES"]
        MW_404[notFoundHandler - 404 JSON]
        MW_ERR[errorHandler - 500 err.status JSON]
    end

    %% Flujo REQUEST (cliente -> servidor)
    API_CLIENT --> MW1
    UI --> MW3

    %% Cadena de middlewares
    MW1 --> MW2
    MW2 --> MW3
    MW3 --> ROUTER

    %% Rutas -> Controlador -> Datos
    ROUTER --> CTRL
    CTRL --> DATA

    %% Flujo RESPONSE (servidor -> cliente)
    DATA --> CTRL
    CTRL --> ROUTER
    ROUTER --> MW2
    MW2 --> API_CLIENT
    MW3 --> UI

    %% Manejo de errores
    ROUTER --> MW_404
    CTRL --> MW_ERR
    MW_404 --> MW_ERR
    MW_ERR --> API_CLIENT
```

**Explicación del flujo por capas:**

| Capa | Archivos | Responsabilidad | Flujo |
|------|----------|-----------------|-------|
| **1. Cliente** | `public/index.html`, Postman, curl | Consume la API vía HTTP | Inicia petición |
| **2. Middlewares** | `app.js` → `express.json()`, `logger.js`, `express.static` | Procesamiento transversal | `json` parsea body → `logger` mide tiempo → `static` sirve frontend |
| **3. Rutas** | `routes/cursoRoutes.js` | Mapea verbos/URLs a controladores | `express.Router()` delega al controlador |
| **4. Controladores** | `controllers/cursoController.js` | Lógica de negocio, validaciones, respuestas | Accede a datos, construye respuesta |
| **5. Datos** | `data/cursos.js` | Persistencia en memoria | `push`, `splice`, `find`, `filter` |
| **6. Errores** | `middlewares/errorHandler.js` | 404 (rutas) + 500/err.status (excepciones) | Captura al final de la cadena |

**Orden crítico en `app.js`:**
```javascript
app.use(express.json());      // 1º: Parse body ANTES de controladores
app.use(logger);              // 2º: Log TODAS las peticiones
app.use(express.static('public')); // 3º: Frontend ANTES que 404
app.use('/api/cursos', router);    // 4º: Rutas API
app.use(notFoundHandler);     // 5º: 404 si ninguna ruta matchea
app.use(errorHandler);        // 6º: Último - captura next(err)
```

---

## 2. Ciclo de Vida de una Petición (Secuencia General)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant EJ as express.json
    participant LG as logger
    participant ST as express.static
    participant RT as cursoRoutes
    participant CT as cursoController
    participant DT as data/cursos

    C->>EJ: HTTP Request POST api/cursos
    EJ->>EJ: Parsea body a req.body
    EJ->>LG: next
    LG->>LG: inicio = Date.now
    LG->>ST: next
    ST->>RT: next ruta api
    RT->>CT: crearCurso req res
    CT->>DT: cursos.push nuevo
    DT-->>CT: OK
    CT->>CT: res.status 201 json success data
    CT-->>RT: Respuesta enviada
    RT-->>LG: Respuesta enviada
    LG->>LG: res.on finish log POST api/cursos 201 5ms
    LG-->>C: HTTP Response 201
```

---

## 3. Secuencia por Endpoint

### 3.1 GET `/api/cursos` (lista + filtro `?creditos=`)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant CT as cursoController.getCursos
    participant DT as data/cursos

    C->>CT: GET api/cursos creditos=4
    CT->>CT: req.query.creditos a Number
    alt creditos invalido
        CT-->>C: 400 status fail message entero positivo
    else valido
        CT->>DT: cursos.filter creditos 4
        DT-->>CT: Array filtrado
        CT-->>C: 200 status success data array
    end
```
**Uso:** `req.query` para filtros opcionales.

---

### 3.2 GET `/api/cursos/:id`

```mermaid
sequenceDiagram
    participant C as Cliente
    participant CT as cursoController.getCursoPorId
    participant DT as data/cursos

    C->>CT: GET api/cursos/1
    CT->>CT: req.params.id a Number
    alt id no numerico
        CT-->>C: 400 status fail message ID invalido
    else valido
        CT->>DT: cursos.find por id
        alt no existe
            CT-->>C: 404 status fail message Curso no encontrado
        else existe
            CT-->>C: 200 status success data curso
        end
    end
```
**Uso:** `req.params` para identificar recurso único.

---

### 3.3 POST `/api/cursos`

```mermaid
sequenceDiagram
    participant C as Cliente
    participant CT as cursoController.crearCurso
    participant DT as data/cursos

    C->>CT: POST api/cursos body nombre codigo creditos
    CT->>CT: validarCurso req.body
    alt validacion falla
        CT-->>C: 400/409 status fail message error
    else valido
        CT->>CT: maxId = Math.max cursos.map id
        CT->>DT: cursos.push nuevo id maxId+1
        DT-->>CT: OK
        CT-->>C: 201 status success data nuevoCurso
    end
```
**Uso:** `req.body` para datos del nuevo recurso.

---

### 3.4 PUT `/api/cursos/:id`

```mermaid
sequenceDiagram
    participant C as Cliente
    participant CT as cursoController.actualizarCurso
    participant DT as data/cursos

    C->>CT: PUT api/cursos/7 body nombre codigo creditos
    CT->>CT: req.params.id a Number
    alt id no numerico
        CT-->>C: 400
    else
        CT->>DT: cursos.findIndex id 7
        alt no existe
            CT-->>C: 404
        else existe
            CT->>CT: validarCurso req.body excludeId 7
            alt validacion falla
                CT-->>C: 400/409
            else valido
                CT->>DT: cursos[7] = actualizado
                CT-->>C: 200 status success data actualizado
            end
        end
    end
```
**Uso:** `req.params` (id) + `req.body` (datos completos).

---

### 3.5 DELETE `/api/cursos/:id`

```mermaid
sequenceDiagram
    participant C as Cliente
    participant CT as cursoController.eliminarCurso
    participant DT as data/cursos

    C->>CT: DELETE api/cursos/7
    CT->>CT: req.params.id a Number
    alt id no numerico
        CT-->>C: 400
    else
        CT->>DT: index = findIndex id 7
        alt no existe
            CT-->>C: 404
        else existe
            CT->>DT: cursoEliminado = cursos.splice index 1
            CT-->>C: 200 status success message Curso eliminado
        end
    end
```
**Uso:** `req.params` para identificar recurso a eliminar.

---

## 4. Diagramas de Flujo de Decisiones

### 4.1 POST `/api/cursos` - Validaciones

```mermaid
flowchart TD
    A[POST api/cursos] --> B{Campos obligatorios}
    B -- No --> C[400 Campos obligatorios]
    B -- Si --> D{Creditos entero > 0}
    D -- No --> E[400 Creditos invalidos]
    D -- Si --> F{Codigo ya existe}
    F -- Si --> G[409 Codigo duplicado]
    F -- No --> H[Crear curso id max+1 push array]
    H --> I[201 status success data curso]
```

### 4.2 GET `/api/cursos/:id` - Búsqueda

```mermaid
flowchart TD
    A[GET api/cursos/id] --> B{ID numerico}
    B -- No --> C[400 ID invalido]
    B -- Si --> D[Buscar en array find por id]
    D --> E{Encontrado}
    E -- No --> F[404 Curso no encontrado]
    E -- Si --> G[200 status success data curso]
```

---

## 5. Manejo de Errores (Error Handler)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant CT as Controlador
    participant MW_ERR as errorHandler 4params
    participant LOG as Console

    CT->>CT: Error sincrono throw o next(err)
    CT-->>MW_ERR: next(err)
    MW_ERR->>LOG: console.error Error no controlado
    alt SyntaxError status 400
        MW_ERR-->>C: 400 status fail message JSON mal formado
    else err.status definido ej 409
        MW_ERR-->>C: err.status status fail message err.message
    else inesperado
        MW_ERR-->>C: 500 status error message Error interno servidor
    end
    Note right of MW_ERR: No expone err.stack al cliente
```

---

## 6. Orden de Middlewares y Por Qué Importa

```mermaid
graph LR
    A[1. express.json] --> B[2. logger]
    B --> C[3. express.static]
    C --> D[4. api cursos routes]
    D --> E[5. notFoundHandler]
    E --> F[6. errorHandler]

    style A fill:#e8f5e9
    style F fill:#ffebee
```

| Orden | Middleware | Por qué en esa posición |
|-------|------------|------------------------|
| 1 | `express.json()` | Debe parsear `req.body` **antes** de que controladores lo lean. Si va después, `req.body` es `undefined`. |
| 2 | `logger` | Registra **todas** las peticiones (incluye estáticas y API). Debe estar antes de rutas para medir tiempo total. |
| 3 | `express.static('public')` | Sirve frontend en `/`. Debe ir **antes** del 404 para que archivos estáticos no caigan en "ruta no encontrada". |
| 4 | `/api/cursos` routes | Rutas de la API. Solo llegan aquí peticiones no estáticas. |
| 5 | `notFoundHandler` | Captura rutas no definidas (ej. `/api/otra`). Debe ir **después** de todas las rutas reales. |
| 6 | `errorHandler` | Último: captura errores de cualquier middleware anterior (`next(err)`). Firma de 4 params obligatoria. |

**Regla de oro:** Middlewares se ejecutan **en orden de registro**. `next()` pasa al siguiente; `next(err)` salta directo al `errorHandler`.

---

## 7. Tabla de Códigos HTTP Usados

| Código | Nombre | Cuándo se devuelve |
|--------|--------|-------------------|
| **200** | OK | GET exitoso, PUT exitoso, DELETE exitoso (con mensaje) |
| **201** | Created | POST exitoso (recurso creado) |
| **400** | Bad Request | JSON mal formado, campos faltantes, créditos inválidos, ID no numérico, query `creditos` no numérico |
| **404** | Not Found | Curso por ID no existe, ruta inexistente |
| **409** | Conflict | Código de curso duplicado (POST/PUT) |
| **500** | Internal Server Error | Error no controlado (excepción no capturada) |

---

## 8. Ejemplo Paso a Paso: POST `/api/cursos` Válido

### Petición
```http
POST /api/cursos HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{"nombre":"Redes","codigo":"INF301","creditos":3}
```

### Qué ocurre en el servidor

1. **express.json()** parsea el body → `req.body = {nombre:"Redes", codigo:"INF301", creditos:3}`
2. **logger** registra `inicio = Date.now()` (ej. 1700000000000)
3. **Router** matchea `POST /api/cursos` → llama `crearCurso(req, res)`
4. **Controlador**:
   - `validarCurso()` → todo OK
   - `maxId = 6` → `nuevoId = 7`
   - `cursos.push({id:7, nombre:"Redes", codigo:"INF301", creditos:3})`
   - `res.status(201).json({status:'success', data:{id:7,...}})`
5. **logger** evento `finish`:
   - `duracion = Date.now() - inicio` (ej. 4 ms)
   - Imprime en consola:
     ```
     2026-10-11T15:30:00.000Z | POST /api/cursos - 201 - 4 ms
     ```
6. **Cliente** recibe:
   ```json
   {
     "status": "success",
     "data": {
       "id": 7,
       "nombre": "Redes",
       "codigo": "INF301",
       "creditos": 3
     }
   }
   ```

---

## 9. Resumen del Flujo de Datos

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌────────────┐
│   Cliente   │────▶│  Middlewares │────▶│   Controlador  │────▶│   Datos    │
│  (HTTP)     │     │  (json, log, │     │  (validación,  │     │ (memoria)  │
└─────────────┘     │   static)    │     │   lógica)      │     └────────────┘
                    └──────────────┘     └────────────────┘            │
                            │                      │                   │
                            ▼                      ▼                   ▼
                     ┌──────────────┐     ┌────────────────┐     ┌────────────┐
                     │   Logger     │     │   Respuesta    │     │  push /    │
                     │  (finish)    │◀────│  JSON uniforme │     │  splice /  │
                     └──────────────┘     └────────────────┘     │  find      │
                                                                  └────────────┘
```

---

> **Nota:** Todos los diagramas Mermaid son compatibles con GitHub, GitLab, VS Code (extensión *Markdown Preview Mermaid Support*) y herramientas de documentación como MkDocs/Mermaid.js.
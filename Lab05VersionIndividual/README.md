# Laboratorio 05 — Node.js, npm y Servidor HTTP

**Versión Individual** · **Estudiante:** Capatinta Almanza Camilo Bladimir Alexander  
**Asignatura:** Introducción al Desarrollo Web · **Año:** 2026 · **Semestre:** 1

---

## 1. Descripción de la Actividad

Este laboratorio tiene como objetivo desarrollar una aplicación backend básica utilizando **Node.js** desde cero, sin frameworks externos. Se emplea **npm** para la gestión del proyecto y los módulos nativos `http`, `fs` y `path` para construir un servidor HTTP capaz de:

- Servir archivos estáticos (HTML, CSS) desde la carpeta `public/`
- Exponer una API REST básica bajo la ruta `/api/estudiantes`
- Leer y escribir datos de forma asíncrona en un archivo JSON local (`data/estudiantes.json`)

### Requerimientos Implementados

| Requerimiento | Estado |
|---------------|--------|
| Inicializar proyecto con `npm init -y` | ✅ |
| Configurar scripts `start` y `dev` en `package.json` | ✅ |
| Estructura de carpetas: `data/`, `public/`, `server.js` | ✅ |
| Servidor HTTP en puerto 3000 con `http.createServer` | ✅ |
| Servir archivos estáticos asíncronamente con `fs.readFile` | ✅ |
| Asignar `Content-Type` correcto (HTML, CSS) | ✅ |
| Endpoint `GET /api/estudiantes` → 200 OK con lista JSON | ✅ |
| Endpoint `POST /api/estudiantes` → 201 Created con nuevo registro | ✅ |
| Manejo de rutas inexistentes → 404 JSON | ✅ |

---

## 2. Estructura del Proyecto

```text
Lab05VersionIndividual/
├── data/
│   └── estudiantes.json       # Base de datos local (JSON)
├── public/
│   ├── index.html             # Interfaz de usuario
│   └── styles.css             # Estilos
├── package.json               # Configuración npm + scripts
└── server.js                  # Servidor HTTP principal
```

---

## 3. Desarrollo del Laboratorio

### 3.1 Inicialización y Configuración (`package.json`)

```bash
npm init -y
```

Se editó el `package.json` resultante para agregar los scripts requeridos y metadatos del autor:

```json
{
  "name": "lab05-nodejs-capatinta-almanza",
  "version": "1.0.0",
  "description": "Laboratorio 05 - Node.js, npm y servidor HTTP - Versión individual del estudiante Capatinta Almanza",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "author": "Capatinta Almanza Camilo Bladimir Alexander",
  "license": "MIT"
}
```

> **Nota:** El flag `--watch` (disponible desde Node.js 18.11+) recarga automáticamente el servidor al detectar cambios en `server.js`, ideal para desarrollo.

### 3.2 Datos Iniciales (`data/estudiantes.json`)

Se creó un archivo JSON con 4 estudiantes (los integrantes del grupo original) como datos semilla:

```json
[
  {
    "id": 1,
    "nombre": "Capatinta Almanza",
    "apellido": "Camilo Bladimir Alexander",
    "codigo": "2021-12345",
    "carrera": "Ingeniería de Sistemas",
    "semestre": 5
  },
  ...
]
```

### 3.3 Interfaz de Usuario (`public/index.html` + `public/styles.css`)

- **HTML semántico** con tabla para listar estudiantes y formulario para crear nuevos.
- **CSS moderno**: variables, flexbox, transiciones, diseño responsivo.
- **JavaScript vanilla** (módulo `<script>` inline) que consume la API vía `fetch()`.

### 3.4 Servidor HTTP (`server.js`)

El archivo principal implementa toda la lógica del servidor. A continuación se detalla su arquitectura.

---

## 4. Demostración de Flujo de Funcionamiento

A continuación se presenta el flujo completo de una petición, desde que el cliente hace una request hasta que recibe la response, con los fragmentos de código clave que intervienen en cada paso.

### 4.1 Diagrama de Flujo General

```text
┌─────────────┐     HTTP Request      ┌──────────────────┐
│   Cliente   │ ─────────────────────▶ │  http.createServer │
│ (Navegador/ │                       │   (server.js)      │
│  Postman)   │ ◀───────────────────── │                    │
└─────────────┘     HTTP Response      └──────────────────┘
                            ▲                    │
                            │                    ▼
                     ┌──────┴──────┐    ┌───────────────┐
                     │  Router     │    │  Handlers     │
                     │  (pathname, │    │  - Static     │
                     │   method)   │    │  - API GET    │
                     └─────────────┘    │  - API POST   │
                                        │  - 404        │
                                        └───────────────┘
```

---

### 4.2 Paso a Paso del Flujo

#### **Paso 1: Creación y Escucha del Servidor**

```javascript
// server.js - líneas 55-61
const server = http.createServer(async (req, res) => {
  // ... lógica de routing y handlers
});

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
```

- `http.createServer()` crea una instancia de `http.Server` (EventEmitter).
- El callback `(req, res) => {}` se ejecuta **cada vez que llega una petición**.
- `server.listen(3000)` vincula el servidor al puerto TCP 3000 y comienza el *Event Loop*.

---

#### **Paso 2: Recepción de la Petición – Parsing de URL y Método**

```javascript
// server.js - líneas 57-62
const { method, url } = req;
const parsedUrl = new URL(url, `http://localhost:${PORT}`);
const pathname = parsedUrl.pathname;
```

- `req` es un `IncomingMessage` (stream legible).
- `res` es un `ServerResponse` (stream escribible).
- `new URL()` normaliza la URL y permite extraer `pathname` sin query strings.

---

#### **Paso 3: Middleware CORS (Preflight OPTIONS)**

```javascript
// server.js - líneas 64-70
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (method === 'OPTIONS') {
  res.writeHead(204);
  res.end();
  return;
}
```

- Permite que el frontend (`public/index.html`) consuma la API sin errores de CORS.
- Responde `204 No Content` a peticiones *preflight* OPTIONS.

---

#### **Paso 4: Routing – API GET `/api/estudiantes`**

```javascript
// server.js - líneas 72-82
if (pathname === '/api/estudiantes' && method === 'GET') {
  try {
    const estudiantes = await readEstudiantes();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(estudiantes));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Error al leer los datos' }));
  }
  return;
}
```

**Flujo interno de `readEstudiantes()`:**

```javascript
// server.js - líneas 17-27
function readEstudiantes() {
  return new Promise((resolve, reject) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) { reject(err); return; }
      try { resolve(JSON.parse(data)); }
      catch (parseErr) { reject(parseErr); }
    });
  });
}
```

- `fs.readFile()` es **asíncrono y no bloqueante**: el *Event Loop* continúa atendiendo otras peticiones mientras el disco lee el archivo.
- Se envuelve en `Promise` para usar `await`/`try-catch` en el handler.
- `res.writeHead(200, { 'Content-Type': 'application/json' })` establece cabecera y status.
- `res.end(JSON.stringify(estudiantes))` serializa y envía el cuerpo.

---

#### **Paso 5: Routing – API POST `/api/estudiantes`**

```javascript
// server.js - líneas 84-98
if (pathname === '/api/estudiantes' && method === 'POST') {
  try {
    const nuevoEstudiante = await parseBody(req);
    const estudiantes = await readEstudiantes();
    const nuevoId = estudiantes.length > 0
      ? Math.max(...estudiantes.map(e => e.id)) + 1
      : 1;
    const estudianteConId = { id: nuevoId, ...nuevoEstudiante };
    estudiantes.push(estudianteConId);
    await writeEstudiantes(estudiantes);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(estudianteConId));
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Datos inválidos' }));
  }
  return;
}
```

**Lectura del body (`parseBody`):**

```javascript
// server.js - líneas 38-48
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}
```

- `req` emite eventos `'data'` (chunks) y `'end'` (fin del stream).
- Se acumulan los chunks en string y se parsea al final.

**Escritura atómica (`writeEstudiantes`):**

```javascript
// server.js - líneas 29-36
function writeEstudiantes(estudiantes) {
  return new Promise((resolve, reject) => {
    fs.writeFile(DATA_FILE, JSON.stringify(estudiantes, null, 2), 'utf8', (err) => {
      if (err) reject(err); else resolve();
    });
  });
}
```

- `JSON.stringify(estudiantes, null, 2)` formatea con indentación legible.
- `fs.writeFile` sobrescribe el archivo completo (simplicidad didáctica; en producción se usaría write temporal + rename).

---

#### **Paso 6: Servir Archivos Estáticos (Fallback)**

```javascript
// server.js - líneas 100-118
let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
const ext = path.extname(filePath);
const contentType = MIME_TYPES[ext] || 'application/octet-stream';

filePath = path.normalize(filePath);
if (!filePath.startsWith(PUBLIC_DIR)) {
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Acceso denegado' }));
  return;
}

serveStaticFile(res, filePath, contentType);
```

- `path.join()` y `path.normalize()` construyen rutas seguras.
- **Protección contra path traversal**: se verifica que `filePath` esté dentro de `PUBLIC_DIR`.
- `MIME_TYPES` mapea extensiones a `Content-Type` correcto.

**Función `serveStaticFile`:**

```javascript
// server.js - líneas 10-25
function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Archivo no encontrado' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error interno del servidor' }));
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}
```

- `fs.readFile` asíncrono para no bloquear el *Event Loop*.
- Diferencia errores `ENOENT` (404) de otros (500).

---

#### **Paso 7: Ruta Inexistente → 404 JSON**

Si ninguna ruta coincide, el flujo llega al final del fallback de archivos estáticos. Si el archivo no existe, `serveStaticFile` responde **404** con JSON. Para rutas API desconocidas, se podría agregar un catch-all explícito:

```javascript
// Opcional: catch-all al final del router
res.writeHead(404, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
```

---

### 4.3 Secuencia de Eventos en el Event Loop (Ejemplo: GET /api/estudiantes)

```text
Timeline del Event Loop:
┌────────────────────────────────────────────────────────────────────┐
│ 1. Llega paquete TCP → libuv lo encola en "I/O callbacks"         │
│ 2. Event Loop ejecuta callback de conexión → createServer callback │
│ 3. Se ejecuta routing (síncrono) → coincide GET /api/estudiantes  │
│ 4. readEstudiantes() → fs.readFile() → delega a thread pool (libuv)│
│ 5. Event Loop LIBRE → atiende otras peticiones concurrentes        │
│ 6. Disco termina lectura → libuv encola callback en "I/O callbacks"│
│ 7. Event Loop ejecuta callback → resolve(Promise) → await continua │
│ 8. res.writeHead() + res.end() → envía respuesta HTTP al cliente   │
└────────────────────────────────────────────────────────────────────┘
```

> **Clave:** Mientras `fs.readFile` espera al disco, **el hilo principal no se bloquea**. Puede procesar cientos de peticiones concurrentes con un solo hilo.

---

## 5. Cómo Ejecutar el Proyecto

### 5.1 Instalación (solo primera vez)

```bash
cd Lab05VersionIndividual
# No hay dependencias externas, solo módulos nativos
```

### 5.2 Modo Producción

```bash
npm start
# Equivalente a: node server.js
```

### 5.3 Modo Desarrollo (auto-reload)

```bash
npm run dev
# Equivalente a: node --watch server.js
```

### 5.4 Verificar en Navegador

- Abrir: `http://localhost:3000` → Interfaz completa (HTML + CSS + JS)
- API directa: `http://localhost:3000/api/estudiantes` → JSON

### 5.5 Probar con cURL / Postman

```bash
# GET - Listar estudiantes
curl http://localhost:3000/api/estudiantes

# POST - Crear estudiante
curl -X POST http://localhost:3000/api/estudiantes \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Nuevo","apellido":"Estudiante","codigo":"2024-99999","carrera":"Ing. Software","semestre":1}'
```

---

## 6. Respuestas al Cuestionario Teórico

### 1. Arquitectura orientada a eventos y I/O no bloqueante vs. servidores multihilo

**Node.js** usa un **único hilo** (main thread) que ejecuta un *Event Loop* continuo. Las operaciones de I/O (red, disco, timers) se delegan al sistema operativo vía **libuv**, que usa un *thread pool* (4 hilos por defecto) para operaciones bloqueantes como `fs`. Cuando la operación termina, libuv encola el callback en la fase *I/O callbacks* del Event Loop.

**Diferencia con Apache Tomcat (multihilo):**
- Tomcat crea un **hilo por petición** (thread-per-request). 1000 peticiones concurrentes = 1000 hilos = alto consumo de memoria y *context switching*.
- Node.js atiende miles de conexiones con **un solo hilo**, usando *callbacks/promesas* para continuar la lógica cuando el I/O termina. Es más escalable para I/O intensivo, pero **no apto para CPU intensivo** (bloquea el Event Loop).

---

### 2. `node_modules`, Git y `package-lock.json`

- **`node_modules/`**: Carpeta donde npm instala las dependencias (código de terceros). **No debe subirse a Git** porque:
  - Ocupa mucho espacio (MB/GB).
  - Se regenera con `npm install`.
  - Puede contener binarios específicos de SO/arquitectura.
- **`package-lock.json`** (o `yarn.lock`/`pnpm-lock.yaml`): **Sí debe versionarse**. Garantiza que **todos los desarrolladores y CI/CD instalen exactamente las mismas versiones** (árbol de dependencias determinístico), evitando "works on my machine".

---

### 3. `fs.readFileSync` vs `fs.readFile` en producción

| Característica | `fs.readFileSync` | `fs.readFile` (async) |
|----------------|-------------------|------------------------|
| **Bloqueo** | Bloquea el hilo principal hasta terminar | No bloquea; delega a thread pool |
| **Event Loop** | Detiene el Event Loop | Event Loop libre para otras peticiones |
| **Concurrencia** | Una petición a la vez | Miles de peticiones concurrentes |
| **Uso en servidor** | ❌ **Nunca** en rutas calientes | ✅ Estándar en producción |
| **Excepción** | Scripts CLI, inicio (config), tests | — |

**En un servidor HTTP de producción, usar `readFileSync` en una ruta frecuente congelaría el servidor para todos los usuarios mientras se lee el disco.** La versión asíncrona permite que Node.js atienda otras peticiones durante la espera de I/O.

---

## 7. Capturas de Funcionamiento (Descripción)

> *Como este es un documento estático, se describen los resultados esperados:*

1. **`npm run dev`** → Consola muestra: `Servidor ejecutándose en http://localhost:3000`
2. **Navegador en `localhost:3000`** → Carga `index.html` con estilos, tabla vacía inicialmente.
3. **Click "Cargar Estudiantes"** → `fetch GET /api/estudiantes` → Tabla se llena con 4 registros.
4. **Llenar formulario + "Guardar Estudiante"** → `fetch POST /api/estudiantes` → Respuesta 201 con nuevo ID → Tabla se actualiza automáticamente.
5. **Recargar página** → Los datos persisten en `data/estudiantes.json`.
6. **Ruta inexistente (ej. `/foo`)** → Respuesta JSON `{ "error": "Archivo no encontrado" }` con status 404.

---

## 8. Conclusiones

Este laboratorio permitió:

- Comprender la **inicialización de proyectos Node.js** con npm y la importancia de `package.json`.
- Aplicar los **módulos nativos** `http`, `fs`, `path` para construir un servidor real sin dependencias externas.
- Experimentar el **modelo asíncrono no bloqueante** de Node.js: mientras el disco lee/escribe, el servidor sigue respondiendo.
- Implementar **routing manual** basado en `pathname` y `method`.
- Manejar **CORS**, **parsing de body**, **validación de rutas** (path traversal) y **códigos de estado HTTP** correctos.
- Separar responsabilidades: **datos** (`data/`), **estáticos** (`public/`), **lógica** (`server.js`).

---

**Autor:** Capatinta Almanza Camilo Bladimir Alexander  
**Fecha:** Octubre 2026  
**Repositorio:** `LABIDWEB/Lab05VersionIndividual`
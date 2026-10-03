# Gestor de Tareas Universitarias

Aplicación web interactiva para la gestión de tareas académicas, desarrollada como parte del **Laboratorio 04** del curso de Desarrollo Web (IDWEB). Permite crear, completar, filtrar y eliminar tareas universitarias de forma dinámica, sin recargar la página, y mantiene los datos guardados entre sesiones mediante `localStorage`.

---

## Descripción

La aplicación simula un tablero de tareas donde el usuario puede registrar actividades académicas indicando título, curso y fecha de entrega. Todo el comportamiento se maneja del lado del cliente con JavaScript puro (Vanilla JS), sin frameworks, aplicando manipulación del DOM, validación de formularios y persistencia local.

---

## Funcionalidades

- **Registro de tareas**: formulario con campos de título, curso y fecha de entrega.
- **Validación en tiempo real**: no permite campos vacíos ni fechas de entrega anteriores a la fecha actual; los errores se muestran en un panel de alertas dinámico.
- **Renderizado dinámico**: las tareas se construyen y actualizan en el DOM sin recargar la página.
- **Cambio de estado**: cada tarea puede marcarse como completada o pendiente, aplicando estilos (tachado) mediante clases CSS dinámicas.
- **Eliminación individual**: cada tarea puede borrarse tanto del DOM como del arreglo de datos.
- **Filtros visuales**: vista de *Todas*, *Pendientes* o *Completadas*.
- **Persistencia de datos**: los cambios (altas, estados, eliminaciones) se sincronizan automáticamente con `localStorage`, y las tareas se recargan al iniciar la página.

---

## Estructura de datos

Cada tarea se representa como un objeto dentro de un arreglo global:

```js
{
  id: Number,
  titulo: String,
  curso: String,
  fechaEntrega: String, // formato YYYY-MM-DD
  completada: Boolean
}
```

El arreglo de tareas se manipula utilizando métodos iterativos de ES6+:

- `map()` para renderizar o transformar tareas.
- `filter()` para aplicar los filtros de vista y eliminar tareas.
- `find()` para localizar una tarea específica por su `id`.
- `reduce()` para cálculos derivados del arreglo (por ejemplo, conteos).

---

## Tecnologías utilizadas

- **HTML5** — estructura del formulario y del contenedor de tareas.
- **CSS3** — estilos, clases dinámicas para tareas completadas y diseño de la interfaz.
- **JavaScript (ES6+)** — lógica de la aplicación, manipulación del DOM y persistencia.
- **localStorage** — almacenamiento de datos en el navegador del cliente.

---

## Estructura del proyecto

```
Lab04/
├── index.html        # Estructura principal de la aplicación
├── css/
│   └── styles.css    # Estilos de la interfaz
├── js/
│   └── logic.js      # Lógica de la aplicación (CRUD, validaciones, DOM, localStorage)
└── README.md         # Este archivo
```

> La estructura puede variar ligeramente según cómo se organice el código; ajusten las rutas si dividen el JS en varios archivos.

---

## Cómo ejecutar el proyecto

1. Clona el repositorio o descarga los archivos.
2. Abre el archivo `index.html` directamente en tu navegador (no requiere servidor ni instalación de dependencias).
3. Empieza a agregar tareas desde el formulario.

---

## Validaciones implementadas

- Ningún campo del formulario puede estar vacío.
- La fecha de entrega debe ser **posterior** a la fecha actual.
- Los mensajes de error se muestran dinámicamente en un contenedor de alertas, sin usar `alert()` del navegador.

---

## Persistencia

Cada acción del usuario (agregar, completar/desmarcar, eliminar) actualiza automáticamente el arreglo de tareas en `localStorage`. Al recargar la página, el evento `DOMContentLoaded` recupera los datos guardados y reconstruye la lista sin perder información.

---

# Rúbrica de Evaluación

## Integrantes

| Alumno                                          | Porcentaje |
| ----------------------------------------------- | ---------: |
| **Capatinta Almanza Camilo Bladimir Alexander** |       100% |

## Rúbrica

| Criterio                       |     Peso | Excelente (19–20) | Bueno (15–18) | En Proceso (11–14) | Deficiente (0–10) | Mi puntaje |
| ------------------------------ | -------: | :---------------: | :-----------: | :----------------: | :---------------: | ---------: |
| Manipulación del DOM y Eventos |      35% |         ☐         |       ☐       |          ☐         |         ☐         |          — |
| Lógica JS y Métodos ES6+       |      30% |         ☐         |       ☐       |          ☐         |         ☐         |          — |
| Persistencia LocalStorage      |      20% |         ☐         |       ☐       |          ☐         |         ☐         |          — |
| Cuestionario Teórico           |      15% |         ☐         |       ☐       |          ☐         |         ☐         |          — |
| **TOTAL**                      | **100%** |                   |               |                    |                   |  **__/20** |


## Curso

Desarrollo Web (IDWEB) — Laboratorio 04
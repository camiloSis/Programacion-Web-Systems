# Descripción del Gestor de Tareas Universitarias

## Resumen General

El **Gestor de Tareas Universitarias** es una aplicación web de una sola página (SPA) desarrollada con tecnologías web nativas (HTML5, CSS3, JavaScript ES6+) que permite a los estudiantes universitarios administrar sus tareas académicas de manera eficiente. La aplicación funciona completamente en el lado del cliente sin requerir backend, servidor o base de datos externa, utilizando `localStorage` del navegador para la persistencia de datos entre sesiones.

---

## Funcionalidades Principales

### 1. Registro de Tareas (Create)
- **Formulario estructurado** con tres campos obligatorios:
  - **Título**: Texto libre que identifica la tarea (ej. "Entregar informe de laboratorio")
  - **Curso**: Nombre de la materia o asignatura (ej. "Desarrollo Web")
  - **Fecha de entrega**: Selector de fecha nativo del navegador (`<input type="date">`)
- **Validación en tiempo real** que impide el envío si:
  - Algún campo está vacío
  - La fecha de entrega es anterior a la fecha actual
- **Retroalimentación visual** mediante panel de alertas dinámico (sin uso de `alert()` nativo)

### 2. Visualización y Renderizado Dinámico (Read)
- **Lista interactiva** que se actualiza instantáneamente sin recargar la página
- Cada tarea muestra:
  - Título principal
  - Curso asociado (con badge visual distintivo)
  - Fecha de entrega formateada (DD/MM/YYYY)
  - Estado visual (completada/pendiente)
- **Contador en tiempo real** que muestra: Total | Pendientes | Completadas

### 3. Gestión de Estado de Tareas (Update)
- **Marcar como completada/pendiente** mediante:
  - Checkbox interactivo
  - Botón "Completar"/"Desmarcar" con cambio de texto contextual
- **Estilo visual diferenciado** para tareas completadas:
  - Texto tachado (line-through)
  - Colores atenuados (grises) para título, curso y fecha
  - Transición suave de estado

### 4. Eliminación de Tareas (Delete)
- **Botón "Eliminar"** por cada tarea
- Eliminación inmediata del DOM y del array de datos
- Sincronización automática con `localStorage`

### 5. Sistema de Filtros
Tres vistas mutuamente excluyentes:
- **Todas**: Muestra el listado completo
- **Pendientes**: Solo tareas con `completada: false`
- **Completadas**: Solo tareas con `completada: true`
- Botones con estado activo visual (resaltado azul)

### 6. Persistencia de Datos (localStorage)
- **Clave de almacenamiento**: `universitary-tasks`
- **Operaciones persistidas automáticamente**:
  - Inserción de nuevas tareas
  - Cambio de estado (completada/pendiente)
  - Eliminación de tareas
- **Carga inicial**: Al evento `DOMContentLoaded`, recupera y reconstruye la lista completa
- **Formato**: Array de objetos serializado como JSON

---

## Estructura de Datos

```javascript
{
  id: Number,           // Identificador único (timestamp + random)
  titulo: String,       // Título de la tarea
  curso: String,        // Curso/materia
  fechaEntrega: String, // Formato ISO: "YYYY-MM-DD"
  completada: Boolean   // Estado de la tarea
}
```

---

## Métodos de Arrays ES6+ Utilizados

| Método | Uso en la Aplicación |
|--------|---------------------|
| `map()` | Transformar tareas a elementos DOM durante el renderizado |
| `filter()` | Aplicar filtros de vista (pendientes/completadas) y eliminar tareas |
| `find()` | Localizar tarea específica por ID para toggle/delete |
| `reduce()` | Cálculos derivados (conteos totales, pendientes, completadas) |

---

## Arquitectura y Organización del Código

### Separación de Responsabilidades
```
index.html          → Estructura semántica, accesibilidad, formularios
css/styles.css      → Estilos, responsive, estados visuales, animaciones
js/logic.js         → Lógica de negocio, DOM, validación, persistencia
```

### Patrones Implementados
- **Inicialización diferida**: `DOMContentLoaded` → `init()`
- **Delegación de eventos**: Listeners directos en elementos creados dinámicamente
- **Funciones puras** para validación, formateo y utilidades
- **Estado único** (`tasks` array) como fuente de verdad
- **Renderizado reactivo**: `renderTasks()` reconstruye vista completa tras cada cambio

---

## Accesibilidad (a11y)

- Formulario con atributos `required`, `aria-label` en botones de acción
- Panel de alertas con `role="alert"` y `aria-live="polite"`
- Navegación por teclado nativa (checkbox, botones, enlaces)
- Contraste de colores WCAG AA en estados activos/inactivos
- Etiquetas asociadas correctamente (`<label for="id">`)

---

## Responsive Design

- **Mobile-first** con breakpoints en 600px
- En pantallas pequeñas:
  - Tarjetas de tarea en columna (flex-direction: column)
  - Botones de filtro centrados
  - Acciones de tarea alineadas a la derecha
  - Espaciado y tipografía adaptados

---

## Validaciones Implementadas

| Campo | Regla | Mensaje de Error |
|-------|-------|------------------|
| Título | No vacío | "El título es obligatorio" |
| Curso | No vacío | "El curso es obligatorio" |
| Fecha entrega | No vacío + ≥ hoy | "La fecha de entrega es obligatoria" / "La fecha de entrega debe ser posterior a la fecha actual" |

- Validación al envío (submit) y limpieza de errores al escribir
- Fecha mínima del input date establecida dinámicamente a hoy

---

## Tecnologías y APIs del Navegador

- **HTML5**: Formularios semánticos, input type="date", estructura de secciones
- **CSS3**: Flexbox, Grid, custom properties, transiciones, animaciones, media queries
- **JavaScript ES6+**: const/let, arrow functions, template literals, destructuring, modules pattern (IIFE implícito), localStorage API, DOM API moderna
- **Web Storage API**: localStorage para persistencia clave-valor

---

## Casos de Uso Principales

1. **Estudiante registra tarea**: Completa formulario → Validación → Tarea aparece en lista → Se guarda en localStorage
2. **Estudiante marca tarea completada**: Click checkbox/botón → Estado cambia → Estilo visual actualizado → Persiste
3. **Estudiante filtra pendientes**: Click "Pendientes" → Lista muestra solo no completadas
4. **Estudiante elimina tarea**: Click "Eliminar" → Tarea desaparece de DOM y almacenamiento
5. **Estudiante cierra y reabre navegador**: Al cargar → Tareas se restauran desde localStorage

---

## Limitaciones Conocidas

- Sin sincronización entre dispositivos/navegadores (solo localStorage local)
- Sin edición de tareas existentes (solo crear, toggle, eliminar)
- Sin categorías/etiquetas adicionales más allá del curso
- Sin ordenamiento por fecha (se muestra por orden de creación)
- Sin exportación/importación de datos

---

## Posibles Extensiones Futuras

- Editar título/curso/fecha de tarea existente
- Ordenar por fecha de entrega, curso o estado
- Categorías/etiquetas personalizadas
- Modo oscuro (dark mode)
- Exportar/importar JSON
- Notificaciones de tareas próximas a vencer
- Estadísticas visuales (gráficos de progreso)
# Auditoría de software — `lab06-api-cursos`

## Resumen ejecutivo

La API presenta una separación básica y clara entre rutas, controlador, datos y middlewares; apropiada para un laboratorio. La colección Postman funciona al ejecutarse directamente: **18 solicitudes y 58 aserciones aprobadas**. Sin embargo, el script oficial de pruebas falla porque referencia un archivo inexistente. La API no está preparada para exposición pública: no tiene autenticación, autorización ni limitación de peticiones. Se identificó un error reproducible: un `POST` con `Content-Type: text/plain` devuelve 500. Los datos son efímeros y el controlador está acoplado al arreglo en memoria. La auditoría de dependencias no detectó vulnerabilidades de producción, pero sí 19 en el árbol de desarrollo de Newman.

## Hallazgos

| Dimensión | Severidad | Descripción | Evidencia | Recomendación concreta |
|---|---|---|---|---|
| Seguridad | Alta | Cualquier cliente que alcance la API puede crear, modificar o eliminar cursos; tampoco hay rate limiting. Es aceptable solo si el alcance es estrictamente local o educativo. | `routes/cursoRoutes.js:5-9`, `app.js:13` | Antes de exponerla, incorporar autenticación, autorización por rol y `express-rate-limit`. |
| Dependencias | Alta | `npm audit` reportó 19 vulnerabilidades en dependencias de desarrollo (1 crítica, 11 altas), originadas por `newman@6.2.3` y transitivas como Handlebars. El audit de producción (`--omit=dev`) dio 0 vulnerabilidades. | `package.json:24-26`; ejecución de `npm audit` | Evaluar una versión mantenida de Newman o reemplazarlo; actualizar y volver a ejecutar la colección y `npm audit`. |
| Manejo de errores | Media | Un `POST /api/cursos` con `Content-Type: text/plain` deja `req.body` como `undefined`; al desestructurarlo se produce un 500, aunque es un error del cliente. | `controllers/cursoController.js:48,69`; `app.js:9` | Exigir `application/json` y responder 415, o validar `req.body` antes de desestructurar y responder 400. Añadir este caso a las pruebas. |
| Logging | Media | `console.error('Error no controlado:', err)` registra el objeto de error completo. Para JSON inválido, la traza incluye el cuerpo enviado, que puede contener información sensible. | `middlewares/errorHandler.js:8-9` | Registrar mensajes estructurados y un identificador de solicitud; no registrar cuerpos de petición ni stacks completos en producción. |
| Pruebas y operación | Media | `npm run test:api` falla: requiere `postman/Lab06_API_Cursos.postman_environment.json`, archivo que no existe. El README indica que dicho script debe funcionar. | `package.json:8`, `README.md:251-258` | Eliminar `--environment` del script, o versionar el entorno sin secretos. Incorporar la ejecución en CI. |
| Arquitectura y mantenibilidad | Media | El controlador manipula directamente el arreglo y contiene validación, reglas e ID generation. Funciona para memoria, pero dificulta pasar a base de datos o probar de forma aislada. | `controllers/cursoController.js:1,48-86`; `data/cursos.js:1-10` | Crear una capa `service` y un repositorio; mantener el arreglo actual como implementación temporal del repositorio. |
| Persistencia | Media | Cada reinicio elimina los cambios y no existen garantías de concurrencia o unicidad fuera del proceso. | `data/cursos.js:1-10` | Para un siguiente alcance, usar una base de datos con restricciones únicas sobre `codigo`. |
| Validación y contrato | Baja | `GET /api/cursos/1.0` devuelve el curso 1; el ID no se valida como entero. Además, la UI fija créditos máximos en 10, pero el backend acepta cualquier entero positivo. | `controllers/cursoController.js:28-35,53`; `public/index.html:43` | Validar `Number.isInteger(id)` y centralizar el esquema/rango de créditos entre frontend y backend. |
| Documentación | Baja | El cuestionario asocia 201 con `Location`, pero el endpoint POST no envía ese encabezado. | `CUESTIONARIO.md:158`; `controllers/cursoController.js:87-90` | Añadir `Location: /api/cursos/:id` al crear, o corregir la redacción documental. |

## Riesgos principales

1. Exposición pública sin controles de acceso: modificación o eliminación no autorizada de cursos.
2. Dependencias de prueba vulnerables: riesgo para estaciones de desarrollo o CI que ejecuten Newman.
3. Errores de entrada mal clasificados como 500 y registro potencial de payloads sensibles.
4. Pérdida de datos tras reiniciar y ausencia de garantías de concurrencia.
5. Script de pruebas roto, que puede ocultar regresiones al equipo.

## Resultado de pruebas

- API iniciada temporalmente en `localhost:3101` y detenida al terminar.
- Newman directo con `--env-var baseUrl=http://localhost:3101`: **18 requests, 58 assertions, 0 fallos**.
- `npm run test:api`: **falló** por falta de `Lab06_API_Cursos.postman_environment.json`.
- Casos adicionales: JSON mal formado devuelve 400; ID no numérico devuelve 400; `POST` con `text/plain` devuelve **500**; `GET /api/cursos/1.0` devuelve 200.
- `.gitignore` sí ignora `*.log`; `server.log` no está versionado.
- El frontend utiliza `async/await` con `try/catch`, escapa los campos textuales al renderizar y cuenta con etiquetas asociadas a controles.

## Qué no se puede evaluar

- Persistencia real, transacciones y concurrencia con base de datos.
- Rendimiento bajo carga, límites de memoria y comportamiento distribuido.
- TLS, proxy inverso, secretos, firewall, despliegue y monitorización de infraestructura.
- Accesibilidad manual con lector de pantalla y compatibilidad entre navegadores.
- Cobertura real de código: no existe una suite unitaria/de integración con reporte de cobertura.

## Plan de remediación

### Inmediata

1. Corregir el script `test:api`.
2. Devolver 400/415 para cuerpos ausentes o tipo de contenido no JSON.
3. Evitar registrar payloads y trazas completas en producción.
4. Actualizar o sustituir Newman tras validar compatibilidad.

### Corto plazo

1. Añadir pruebas automatizadas de controlador/API, incluyendo content type, IDs decimales, límites, duplicados y errores.
2. Centralizar validación con un esquema, por ejemplo Zod o express-validator.
3. Añadir autenticación, autorización, rate limiting y cabeceras de seguridad si se desplegará fuera de localhost.

### Mediano plazo

1. Extraer servicios y repositorios.
2. Migrar a una base de datos con restricciones de unicidad.
3. Incorporar CI con `npm audit`, pruebas y reporte de cobertura; documentar variables de entorno y el contrato mediante OpenAPI.

package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"mayu/models"
	"mayu/store"
	"mayu/utils"

	"github.com/gin-gonic/gin"
)

func (h *API) ListarAmbientes(c *gin.Context) {
	f := store.AmbienteFiltro{
		Tipo:     c.Query("tipo"),
		Estado:   c.Query("estado"),
		Edificio: c.Query("edificio"),
		Buscar:   strings.TrimSpace(c.Query("q")),
	}

	if f.Tipo != "" && !utils.EsTipoAmbiente(f.Tipo) {
		fail(c, http.StatusBadRequest, "El parámetro tipo debe ser: aula, laboratorio o sala_estudio")
		return
	}
	if f.Estado != "" && !utils.EsEstadoAmbiente(f.Estado) {
		fail(c, http.StatusBadRequest, "El parámetro estado debe ser: disponible o mantenimiento")
		return
	}
	if capStr := c.Query("capacidad_min"); capStr != "" {
		n, err := strconv.Atoi(capStr)
		if err != nil || n <= 0 {
			fail(c, http.StatusBadRequest, "El parámetro capacidad_min debe ser un número entero positivo")
			return
		}
		f.CapacidadMin = n
	}

	ambientes, err := h.Ambientes.Listar(f)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al consultar los ambientes")
		return
	}
	ok(c, ambientes)
}

func (h *API) AmbientesDisponibles(c *gin.Context) {
	f := store.DisponibilidadFiltro{
		Fecha:      c.Query("fecha"),
		HoraInicio: c.Query("hora_inicio"),
		HoraFin:    c.Query("hora_fin"),
		Tipo:       c.Query("tipo"),
	}

	if f.Fecha == "" || f.HoraInicio == "" || f.HoraFin == "" {
		fail(c, http.StatusBadRequest, "Los parámetros fecha, hora_inicio y hora_fin son obligatorios")
		return
	}
	if !utils.FechaValida(f.Fecha) {
		fail(c, http.StatusBadRequest, "La fecha debe tener formato YYYY-MM-DD")
		return
	}
	if valido, msg := utils.HorarioValido(f.HoraInicio, f.HoraFin); !valido {
		fail(c, http.StatusBadRequest, msg)
		return
	}
	if f.Tipo != "" && !utils.EsTipoAmbiente(f.Tipo) {
		fail(c, http.StatusBadRequest, "El parámetro tipo debe ser: aula, laboratorio o sala_estudio")
		return
	}
	if capStr := c.Query("capacidad_min"); capStr != "" {
		n, err := strconv.Atoi(capStr)
		if err != nil || n <= 0 {
			fail(c, http.StatusBadRequest, "El parámetro capacidad_min debe ser un número entero positivo")
			return
		}
		f.CapacidadMin = n
	}

	ambientes, err := h.Ambientes.Disponibles(f)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al consultar la disponibilidad")
		return
	}
	ok(c, ambientes)
}

func (h *API) ObtenerAmbiente(c *gin.Context) {
	id, okID := idValido(c)
	if !okID {
		return
	}

	ambiente, err := h.Ambientes.Obtener(id)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, http.StatusNotFound, "Ambiente no encontrado")
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al consultar el ambiente")
		return
	}
	ok(c, ambiente)
}

func validarAmbiente(a *models.Ambiente, excluirID int) (string, int) {
	a.Nombre = strings.TrimSpace(a.Nombre)
	a.Edificio = strings.TrimSpace(a.Edificio)
	a.Recursos = strings.TrimSpace(a.Recursos)
	a.Descripcion = strings.TrimSpace(a.Descripcion)

	if a.Nombre == "" || a.Edificio == "" {
		return "Los campos nombre y edificio son obligatorios", http.StatusBadRequest
	}
	if len(a.Nombre) > 100 {
		return "El nombre no puede superar los 100 caracteres", http.StatusBadRequest
	}
	if len(a.Edificio) > 60 {
		return "El edificio no puede superar los 60 caracteres", http.StatusBadRequest
	}
	if !utils.EsTipoAmbiente(a.Tipo) {
		return "El tipo debe ser: aula, laboratorio o sala_estudio", http.StatusBadRequest
	}
	if a.Capacidad <= 0 || a.Capacidad > 500 {
		return "La capacidad debe ser un número entre 1 y 500", http.StatusBadRequest
	}
	if a.Piso < 0 || a.Piso > 50 {
		return "El piso debe estar entre 0 y 50", http.StatusBadRequest
	}
	if a.Estado == "" {
		a.Estado = models.EstadoDisp
	}
	if !utils.EsEstadoAmbiente(a.Estado) {
		return "El estado debe ser: disponible o mantenimiento", http.StatusBadRequest
	}
	if len(a.Recursos) > 300 || len(a.Descripcion) > 300 {
		return "Los recursos y la descripción no pueden superar los 300 caracteres", http.StatusBadRequest
	}
	return "", 0
}

func (h *API) CrearAmbiente(c *gin.Context) {
	var a models.Ambiente
	if err := c.ShouldBindJSON(&a); err != nil {
		fail(c, http.StatusBadRequest, "El cuerpo JSON no es válido")
		return
	}

	if msg, code := validarAmbiente(&a, 0); msg != "" {
		fail(c, code, msg)
		return
	}

	existe, err := h.Ambientes.ExisteNombre(a.Nombre, a.Edificio, 0)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al validar el ambiente")
		return
	}
	if existe {
		fail(c, http.StatusConflict, "Ya existe un ambiente con ese nombre en ese edificio")
		return
	}

	nuevo, err := h.Ambientes.Crear(a)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al crear el ambiente")
		return
	}
	creado(c, nuevo)
}

func (h *API) ActualizarAmbiente(c *gin.Context) {
	id, okID := idValido(c)
	if !okID {
		return
	}

	var a models.Ambiente
	if err := c.ShouldBindJSON(&a); err != nil {
		fail(c, http.StatusBadRequest, "El cuerpo JSON no es válido")
		return
	}

	if msg, code := validarAmbiente(&a, id); msg != "" {
		fail(c, code, msg)
		return
	}

	existe, err := h.Ambientes.ExisteNombre(a.Nombre, a.Edificio, id)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al validar el ambiente")
		return
	}
	if existe {
		fail(c, http.StatusConflict, "Ya existe un ambiente con ese nombre en ese edificio")
		return
	}

	actualizado, err := h.Ambientes.Actualizar(id, a)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, http.StatusNotFound, "Ambiente no encontrado")
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al actualizar el ambiente")
		return
	}
	ok(c, actualizado)
}

func (h *API) EliminarAmbiente(c *gin.Context) {
	id, okID := idValido(c)
	if !okID {
		return
	}

	err := h.Ambientes.Eliminar(id)
	switch {
	case errors.Is(err, sql.ErrNoRows):
		fail(c, http.StatusNotFound, "Ambiente no encontrado")
	case errors.Is(err, store.ErrReservasActivas):
		fail(c, http.StatusConflict, "No se puede eliminar el ambiente porque tiene reservas activas")
	case err != nil:
		fail(c, http.StatusInternalServerError, "Error al eliminar el ambiente")
	default:
		ok(c, gin.H{"message": "Ambiente eliminado correctamente"})
	}
}

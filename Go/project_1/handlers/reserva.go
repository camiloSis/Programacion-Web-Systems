package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"mayu/middlewares"
	"mayu/models"
	"mayu/store"
	"mayu/utils"

	"github.com/gin-gonic/gin"
)

func (h *API) ListarReservas(c *gin.Context) {
	u, _ := middlewares.UsuarioActual(c)

	f := store.ReservaFiltro{
		Estado: c.Query("estado"),
		Codigo: strings.TrimSpace(c.Query("codigo")),
	}

	if u.Rol != models.RolAdmin {
		// un estudiante solo ve sus propias reservas
		f.Codigo = u.Codigo
	}

	if fecha := c.Query("fecha"); fecha != "" {
		if !utils.FechaValida(fecha) {
			fail(c, http.StatusBadRequest, "El parámetro fecha debe tener formato YYYY-MM-DD")
			return
		}
		f.Fecha = fecha
	}
	if ambStr := c.Query("ambiente_id"); ambStr != "" {
		n, err := strconv.Atoi(ambStr)
		if err != nil || n <= 0 {
			fail(c, http.StatusBadRequest, "El parámetro ambiente_id debe ser un número entero positivo")
			return
		}
		f.AmbienteID = n
	}
	if f.Estado != "" && !utils.EsEstadoReserva(f.Estado) {
		fail(c, http.StatusBadRequest, "El parámetro estado debe ser: activa o cancelada")
		return
	}

	reservas, err := h.Reservas.Listar(f)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al consultar las reservas")
		return
	}
	ok(c, reservas)
}

func (h *API) ObtenerReserva(c *gin.Context) {
	id, okID := idValido(c)
	if !okID {
		return
	}

	reserva, err := h.Reservas.Obtener(id)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, http.StatusNotFound, "Reserva no encontrada")
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al consultar la reserva")
		return
	}
	ok(c, reserva)
}

func validarReserva(r *models.Reserva) string {
	r.Estudiante = strings.TrimSpace(r.Estudiante)
	r.Codigo = strings.TrimSpace(strings.ToUpper(r.Codigo))
	r.Motivo = strings.TrimSpace(r.Motivo)

	if r.AmbienteID <= 0 {
		return "Debe seleccionar un ambiente válido"
	}
	if r.Estudiante == "" {
		return "El nombre del estudiante es obligatorio"
	}
	if len(r.Estudiante) < 3 || len(r.Estudiante) > 80 {
		return "El nombre del estudiante debe tener entre 3 y 80 caracteres"
	}
	if !utils.CodigoEstudianteValido(r.Codigo) {
		return "El código debe tener entre 4 y 20 caracteres (letras, números o guiones)"
	}
	if r.Fecha == "" || !utils.FechaValida(r.Fecha) {
		return "La fecha debe tener formato YYYY-MM-DD"
	}
	if !utils.FechaNoPasada(r.Fecha) {
		return "La fecha no puede ser anterior a hoy"
	}
	if valido, msg := utils.HorarioValido(r.HoraInicio, r.HoraFin); !valido {
		return msg
	}
	if len(r.Motivo) > 200 {
		return "El motivo no puede superar los 200 caracteres"
	}
	return ""
}

func (h *API) prepararReserva(c *gin.Context, r *models.Reserva, excluirID int) bool {
	if msg := validarReserva(r); msg != "" {
		fail(c, http.StatusBadRequest, msg)
		return false
	}

	ambiente, err := h.Ambientes.Obtener(r.AmbienteID)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, http.StatusNotFound, "El ambiente seleccionado no existe")
		return false
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al validar el ambiente")
		return false
	}
	if ambiente.Estado != models.EstadoDisp {
		fail(c, http.StatusConflict, "El ambiente está en mantenimiento y no puede reservarse")
		return false
	}

	solapada, err := h.Reservas.ExisteSolapamiento(r.AmbienteID, r.Fecha, r.HoraInicio, r.HoraFin, excluirID)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al verificar la disponibilidad")
		return false
	}
	if solapada {
		fail(c, http.StatusConflict, "El ambiente ya tiene una reserva activa que se superpone con este horario")
		return false
	}
	return true
}

func (h *API) CrearReserva(c *gin.Context) {
	u, _ := middlewares.UsuarioActual(c)

	var r models.Reserva
	if err := c.ShouldBindJSON(&r); err != nil {
		fail(c, http.StatusBadRequest, "El cuerpo JSON no es válido")
		return
	}
	if u.Rol != models.RolAdmin {
		r.Codigo = u.Codigo // el estudiante siempre reserva con su propio código
	}
	if !h.prepararReserva(c, &r, 0) {
		return
	}

	nueva, err := h.Reservas.Crear(r)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al registrar la reserva")
		return
	}
	creado(c, nueva)
}

func (h *API) ActualizarReserva(c *gin.Context) {
	id, okID := idValido(c)
	if !okID {
		return
	}

	u, _ := middlewares.UsuarioActual(c)
	existente, err := h.Reservas.Obtener(id)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, http.StatusNotFound, "Reserva no encontrada")
		return
	} else if err != nil {
		fail(c, http.StatusInternalServerError, "Error al consultar la reserva")
		return
	}
	if u.Rol != models.RolAdmin && existente.Codigo != u.Codigo {
		fail(c, http.StatusForbidden, "Solo puede modificar sus propias reservas")
		return
	}

	var r models.Reserva
	if err := c.ShouldBindJSON(&r); err != nil {
		fail(c, http.StatusBadRequest, "El cuerpo JSON no es válido")
		return
	}
	if !h.prepararReserva(c, &r, id) {
		return
	}

	actualizada, err := h.Reservas.Actualizar(id, r)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, http.StatusNotFound, "Reserva no encontrada")
		return
	}
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al actualizar la reserva")
		return
	}
	ok(c, actualizada)
}

func (h *API) CancelarReserva(c *gin.Context) {
	id, okID := idValido(c)
	if !okID {
		return
	}

	u, _ := middlewares.UsuarioActual(c)
	existente, err := h.Reservas.Obtener(id)
	if errors.Is(err, sql.ErrNoRows) {
		fail(c, http.StatusNotFound, "Reserva no encontrada")
		return
	} else if err != nil {
		fail(c, http.StatusInternalServerError, "Error al consultar la reserva")
		return
	}
	if u.Rol != models.RolAdmin && existente.Codigo != u.Codigo {
		fail(c, http.StatusForbidden, "Solo puede cancelar sus propias reservas")
		return
	}

	cancelada, err := h.Reservas.Cancelar(id)
	switch {
	case errors.Is(err, sql.ErrNoRows):
		fail(c, http.StatusNotFound, "Reserva no encontrada")
	case errors.Is(err, store.ErrYaCancelada):
		fail(c, http.StatusConflict, "La reserva ya está cancelada")
	case err != nil:
		fail(c, http.StatusInternalServerError, "Error al cancelar la reserva")
	default:
		ok(c, cancelada)
	}
}

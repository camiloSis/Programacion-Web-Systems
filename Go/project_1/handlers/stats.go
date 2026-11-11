package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *API) Estadisticas(c *gin.Context) {
	type Conteo struct {
		Tipo     string `json:"tipo"`
		Cantidad int    `json:"cantidad"`
	}
	type UsoAmbiente struct {
		ID              int     `json:"id"`
		Nombre          string  `json:"nombre"`
		Tipo            string  `json:"tipo"`
		Reservas        int     `json:"reservas"`
		HorasReservadas float64 `json:"horas_reservadas"`
	}
	type ReservasFecha struct {
		Fecha    string `json:"fecha"`
		Cantidad int    `json:"cantidad"`
	}
	type Totales struct {
		AmbientesTotal         int `json:"ambientes_total"`
		AmbientesDisponibles   int `json:"ambientes_disponibles"`
		AmbientesMantenimiento int `json:"ambientes_mantenimiento"`
		ReservasActivas        int `json:"reservas_activas"`
		ReservasCanceladas     int `json:"reservas_canceladas"`
	}

	var tot Totales
	err := h.Ambientes.DB.QueryRow(`
		SELECT
			(SELECT COUNT(*) FROM ambientes),
			(SELECT COUNT(*) FROM ambientes WHERE estado = 'disponible'),
			(SELECT COUNT(*) FROM ambientes WHERE estado = 'mantenimiento'),
			(SELECT COUNT(*) FROM reservas WHERE estado = 'activa'),
			(SELECT COUNT(*) FROM reservas WHERE estado = 'cancelada')`,
	).Scan(&tot.AmbientesTotal, &tot.AmbientesDisponibles, &tot.AmbientesMantenimiento,
		&tot.ReservasActivas, &tot.ReservasCanceladas)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al calcular las estadísticas")
		return
	}

	porTipo := []Conteo{}
	rows, err := h.Ambientes.DB.Query(`SELECT tipo, COUNT(*) FROM ambientes GROUP BY tipo ORDER BY tipo`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al calcular las estadísticas")
		return
	}
	for rows.Next() {
		var ct Conteo
		if err := rows.Scan(&ct.Tipo, &ct.Cantidad); err != nil {
			rows.Close()
			fail(c, http.StatusInternalServerError, "Error al calcular las estadísticas")
			return
		}
		porTipo = append(porTipo, ct)
	}
	rows.Close()

	uso := []UsoAmbiente{}
	rows, err = h.Ambientes.DB.Query(`
		SELECT a.id, a.nombre, a.tipo, COUNT(r.id) AS reservas,
			COALESCE(SUM(
				(CAST(substr(r.hora_fin, 1, 2) AS INTEGER) * 60 + CAST(substr(r.hora_fin, 4, 2) AS INTEGER)) -
				(CAST(substr(r.hora_inicio, 1, 2) AS INTEGER) * 60 + CAST(substr(r.hora_inicio, 4, 2) AS INTEGER))
			), 0) / 60.0 AS horas
		FROM ambientes a
		LEFT JOIN reservas r ON r.ambiente_id = a.id AND r.estado = 'activa'
		GROUP BY a.id
		ORDER BY reservas DESC, horas DESC, a.nombre COLLATE NOCASE`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al calcular las estadísticas")
		return
	}
	for rows.Next() {
		var u UsoAmbiente
		if err := rows.Scan(&u.ID, &u.Nombre, &u.Tipo, &u.Reservas, &u.HorasReservadas); err != nil {
			rows.Close()
			fail(c, http.StatusInternalServerError, "Error al calcular las estadísticas")
			return
		}
		uso = append(uso, u)
	}
	rows.Close()

	porFecha := []ReservasFecha{}
	rows, err = h.Ambientes.DB.Query(`
		SELECT fecha, COUNT(*) FROM reservas
		WHERE estado = 'activa'
		GROUP BY fecha ORDER BY fecha`)
	if err != nil {
		fail(c, http.StatusInternalServerError, "Error al calcular las estadísticas")
		return
	}
	for rows.Next() {
		var rf ReservasFecha
		if err := rows.Scan(&rf.Fecha, &rf.Cantidad); err != nil {
			rows.Close()
			fail(c, http.StatusInternalServerError, "Error al calcular las estadísticas")
			return
		}
		porFecha = append(porFecha, rf)
	}
	rows.Close()

	ok(c, gin.H{
		"totales":            tot,
		"por_tipo":           porTipo,
		"uso_ambientes":      uso,
		"reservas_por_fecha": porFecha,
	})
}

package store

import (
	"database/sql"
	"errors"

	"mayu/models"
)

var ErrYaCancelada = errors.New("la reserva ya está cancelada")

const columnasReserva = `r.id, r.ambiente_id, IFNULL(a.nombre, '(ambiente eliminado)'),
	r.estudiante, r.codigo, r.fecha, r.hora_inicio, r.hora_fin, r.motivo, r.estado, r.creado_en`

const fromReserva = `FROM reservas r LEFT JOIN ambientes a ON a.id = r.ambiente_id`

type ReservaFiltro struct {
	Fecha      string
	AmbienteID int
	Estado     string
	Codigo     string
}

type ReservaStore struct {
	DB *sql.DB
}

func escanearReserva(sc interface{ Scan(...any) error }) (models.Reserva, error) {
	var r models.Reserva
	err := sc.Scan(&r.ID, &r.AmbienteID, &r.AmbienteNombre, &r.Estudiante, &r.Codigo,
		&r.Fecha, &r.HoraInicio, &r.HoraFin, &r.Motivo, &r.Estado, &r.CreadoEn)
	return r, err
}

func (s *ReservaStore) Listar(f ReservaFiltro) ([]models.Reserva, error) {
	query := `SELECT ` + columnasReserva + ` ` + fromReserva + ` WHERE 1=1`
	var args []any

	if f.Fecha != "" {
		query += ` AND r.fecha = ?`
		args = append(args, f.Fecha)
	}
	if f.AmbienteID > 0 {
		query += ` AND r.ambiente_id = ?`
		args = append(args, f.AmbienteID)
	}
	if f.Estado != "" {
		query += ` AND r.estado = ?`
		args = append(args, f.Estado)
	}
	if f.Codigo != "" {
		query += ` AND r.codigo LIKE ?`
		args = append(args, "%"+f.Codigo+"%")
	}
	query += ` ORDER BY r.fecha, r.hora_inicio`

	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reservas := []models.Reserva{}
	for rows.Next() {
		r, err := escanearReserva(rows)
		if err != nil {
			return nil, err
		}
		reservas = append(reservas, r)
	}
	return reservas, rows.Err()
}

func (s *ReservaStore) Obtener(id int) (models.Reserva, error) {
	return escanearReserva(s.DB.QueryRow(
		`SELECT `+columnasReserva+` `+fromReserva+` WHERE r.id = ?`, id))
}

func (s *ReservaStore) ExisteSolapamiento(ambienteID int, fecha, inicio, fin string, excluirID int) (bool, error) {
	var n int
	err := s.DB.QueryRow(
		`SELECT COUNT(*) FROM reservas
		 WHERE ambiente_id = ? AND fecha = ? AND estado = 'activa'
		   AND id != ?
		   AND hora_inicio < ? AND hora_fin > ?`,
		ambienteID, fecha, excluirID, fin, inicio,
	).Scan(&n)
	return n > 0, err
}

func (s *ReservaStore) Crear(r models.Reserva) (models.Reserva, error) {
	res, err := s.DB.Exec(
		`INSERT INTO reservas (ambiente_id, estudiante, codigo, fecha, hora_inicio, hora_fin, motivo)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		r.AmbienteID, r.Estudiante, r.Codigo, r.Fecha, r.HoraInicio, r.HoraFin, r.Motivo,
	)
	if err != nil {
		return models.Reserva{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return models.Reserva{}, err
	}
	return s.Obtener(int(id))
}

func (s *ReservaStore) Actualizar(id int, r models.Reserva) (models.Reserva, error) {
	res, err := s.DB.Exec(
		`UPDATE reservas
		 SET ambiente_id = ?, estudiante = ?, codigo = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, motivo = ?
		 WHERE id = ?`,
		r.AmbienteID, r.Estudiante, r.Codigo, r.Fecha, r.HoraInicio, r.HoraFin, r.Motivo, id,
	)
	if err != nil {
		return models.Reserva{}, err
	}
	filas, err := res.RowsAffected()
	if err != nil {
		return models.Reserva{}, err
	}
	if filas == 0 {
		return models.Reserva{}, sql.ErrNoRows
	}
	return s.Obtener(id)
}

func (s *ReservaStore) Cancelar(id int) (models.Reserva, error) {
	actual, err := s.Obtener(id)
	if err != nil {
		return models.Reserva{}, err
	}
	if actual.Estado == models.ReservaCancelada {
		return models.Reserva{}, ErrYaCancelada
	}
	if _, err := s.DB.Exec(`UPDATE reservas SET estado = 'cancelada' WHERE id = ?`, id); err != nil {
		return models.Reserva{}, err
	}
	return s.Obtener(id)
}

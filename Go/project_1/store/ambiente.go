package store

import (
	"database/sql"
	"errors"

	"mayu/models"
)

var (
	ErrNombreRepetido  = errors.New("ya existe un ambiente con ese nombre en ese edificio")
	ErrReservasActivas = errors.New("el ambiente tiene reservas activas")
)

const columnasAmbiente = `id, nombre, tipo, capacidad, edificio, piso, recursos, estado, descripcion`

type AmbienteFiltro struct {
	Tipo         string
	Estado       string
	Edificio     string
	CapacidadMin int
	Buscar       string
}

type DisponibilidadFiltro struct {
	Fecha        string
	HoraInicio   string
	HoraFin      string
	Tipo         string
	CapacidadMin int
}

type AmbienteStore struct {
	DB *sql.DB
}

func escanearAmbiente(sc interface{ Scan(...any) error }) (models.Ambiente, error) {
	var a models.Ambiente
	err := sc.Scan(&a.ID, &a.Nombre, &a.Tipo, &a.Capacidad, &a.Edificio, &a.Piso, &a.Recursos, &a.Estado, &a.Descripcion)
	return a, err
}

func (s *AmbienteStore) Listar(f AmbienteFiltro) ([]models.Ambiente, error) {
	query := `SELECT ` + columnasAmbiente + ` FROM ambientes WHERE 1=1`
	var args []any

	if f.Tipo != "" {
		query += ` AND tipo = ?`
		args = append(args, f.Tipo)
	}
	if f.Estado != "" {
		query += ` AND estado = ?`
		args = append(args, f.Estado)
	}
	if f.Edificio != "" {
		query += ` AND edificio = ?`
		args = append(args, f.Edificio)
	}
	if f.CapacidadMin > 0 {
		query += ` AND capacidad >= ?`
		args = append(args, f.CapacidadMin)
	}
	if f.Buscar != "" {
		like := "%" + f.Buscar + "%"
		query += ` AND (nombre LIKE ? OR edificio LIKE ? OR recursos LIKE ? OR descripcion LIKE ?)`
		args = append(args, like, like, like, like)
	}
	query += ` ORDER BY nombre COLLATE NOCASE`

	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ambientes := []models.Ambiente{}
	for rows.Next() {
		a, err := escanearAmbiente(rows)
		if err != nil {
			return nil, err
		}
		ambientes = append(ambientes, a)
	}
	return ambientes, rows.Err()
}

func (s *AmbienteStore) Disponibles(f DisponibilidadFiltro) ([]models.Ambiente, error) {
	query := `SELECT ` + columnasAmbiente + `
		FROM ambientes a
		WHERE a.estado = 'disponible'
		  AND NOT EXISTS (
			SELECT 1 FROM reservas r
			WHERE r.ambiente_id = a.id
			  AND r.estado = 'activa'
			  AND r.fecha = ?
			  AND r.hora_inicio < ?
			  AND r.hora_fin > ?
		  )`
	args := []any{f.Fecha, f.HoraFin, f.HoraInicio}

	if f.Tipo != "" {
		query += ` AND a.tipo = ?`
		args = append(args, f.Tipo)
	}
	if f.CapacidadMin > 0 {
		query += ` AND a.capacidad >= ?`
		args = append(args, f.CapacidadMin)
	}
	query += ` ORDER BY a.nombre COLLATE NOCASE`

	rows, err := s.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ambientes := []models.Ambiente{}
	for rows.Next() {
		a, err := escanearAmbiente(rows)
		if err != nil {
			return nil, err
		}
		ambientes = append(ambientes, a)
	}
	return ambientes, rows.Err()
}

func (s *AmbienteStore) Obtener(id int) (models.Ambiente, error) {
	return escanearAmbiente(s.DB.QueryRow(
		`SELECT `+columnasAmbiente+` FROM ambientes WHERE id = ?`, id))
}

func (s *AmbienteStore) ExisteNombre(nombre, edificio string, excluirID int) (bool, error) {
	var n int
	err := s.DB.QueryRow(
		`SELECT COUNT(*) FROM ambientes WHERE nombre = ? AND edificio = ? AND id != ?`,
		nombre, edificio, excluirID,
	).Scan(&n)
	return n > 0, err
}

func (s *AmbienteStore) Crear(a models.Ambiente) (models.Ambiente, error) {
	res, err := s.DB.Exec(
		`INSERT INTO ambientes (nombre, tipo, capacidad, edificio, piso, recursos, estado, descripcion)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		a.Nombre, a.Tipo, a.Capacidad, a.Edificio, a.Piso, a.Recursos, a.Estado, a.Descripcion,
	)
	if err != nil {
		return models.Ambiente{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return models.Ambiente{}, err
	}
	return s.Obtener(int(id))
}

func (s *AmbienteStore) Actualizar(id int, a models.Ambiente) (models.Ambiente, error) {
	res, err := s.DB.Exec(
		`UPDATE ambientes
		 SET nombre = ?, tipo = ?, capacidad = ?, edificio = ?, piso = ?, recursos = ?, estado = ?, descripcion = ?
		 WHERE id = ?`,
		a.Nombre, a.Tipo, a.Capacidad, a.Edificio, a.Piso, a.Recursos, a.Estado, a.Descripcion, id,
	)
	if err != nil {
		return models.Ambiente{}, err
	}
	filas, err := res.RowsAffected()
	if err != nil {
		return models.Ambiente{}, err
	}
	if filas == 0 {
		return models.Ambiente{}, sql.ErrNoRows
	}
	return s.Obtener(id)
}

func (s *AmbienteStore) Eliminar(id int) error {
	var activas int
	if err := s.DB.QueryRow(
		`SELECT COUNT(*) FROM reservas WHERE ambiente_id = ? AND estado = 'activa'`, id,
	).Scan(&activas); err != nil {
		return err
	}
	if activas > 0 {
		return ErrReservasActivas
	}

	res, err := s.DB.Exec(`DELETE FROM ambientes WHERE id = ?`, id)
	if err != nil {
		return err
	}
	filas, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if filas == 0 {
		return sql.ErrNoRows
	}
	return nil
}

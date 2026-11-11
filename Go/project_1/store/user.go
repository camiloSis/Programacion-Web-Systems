package store

import (
	"database/sql"

	"mayu/models"
	"mayu/utils"
)

type UserStore struct {
	DB *sql.DB
}

func (s *UserStore) Crear(u models.User, password string) (int, error) {
	hash, err := utils.HashPassword(password)
	if err != nil {
		return 0, err
	}
	res, err := s.DB.Exec(
		`INSERT INTO users (usuario, password_hash, nombre, rol, codigo) VALUES (?, ?, ?, ?, ?)`,
		u.Usuario, hash, u.Nombre, u.Rol, u.Codigo,
	)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	return int(id), err
}

func escanearUsuario(sc interface{ Scan(...any) error }) (models.User, error) {
	var u models.User
	err := sc.Scan(&u.ID, &u.Usuario, &u.Nombre, &u.Rol, &u.Codigo)
	return u, err
}

const columnasUsuario = `id, usuario, nombre, rol, IFNULL(codigo, '')`

func (s *UserStore) ObtenerPorUsuario(usuario string) (models.User, string, error) {
	var u models.User
	var hash string
	err := s.DB.QueryRow(
		`SELECT id, usuario, nombre, rol, IFNULL(codigo, ''), password_hash
		 FROM users WHERE usuario = ?`, usuario,
	).Scan(&u.ID, &u.Usuario, &u.Nombre, &u.Rol, &u.Codigo, &hash)
	return u, hash, err
}

func (s *UserStore) ObtenerPorID(id int) (models.User, error) {
	return escanearUsuario(s.DB.QueryRow(
		`SELECT `+columnasUsuario+` FROM users WHERE id = ?`, id))
}

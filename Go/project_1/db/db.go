package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func Open(path string) (*sql.DB, error) {
	if dir := filepath.Dir(path); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
	}

	dsn := fmt.Sprintf("file:%s?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)", path)
	conn, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	conn.SetMaxOpenConns(1)

	if err := conn.Ping(); err != nil {
		return nil, err
	}
	if err := migrate(conn); err != nil {
		return nil, err
	}
	if err := seed(conn); err != nil {
		return nil, err
	}
	return conn, nil
}

func migrate(conn *sql.DB) error {
	schema := `
CREATE TABLE IF NOT EXISTS ambientes (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	nombre      TEXT NOT NULL,
	tipo        TEXT NOT NULL CHECK (tipo IN ('aula', 'laboratorio', 'sala_estudio')),
	capacidad   INTEGER NOT NULL CHECK (capacidad > 0),
	edificio    TEXT NOT NULL,
	piso        INTEGER NOT NULL DEFAULT 1,
	recursos    TEXT NOT NULL DEFAULT '',
	estado      TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'mantenimiento')),
	descripcion TEXT NOT NULL DEFAULT '',
	UNIQUE (nombre, edificio)
);

CREATE TABLE IF NOT EXISTS reservas (
	id             INTEGER PRIMARY KEY AUTOINCREMENT,
	ambiente_id    INTEGER NOT NULL REFERENCES ambientes(id) ON DELETE RESTRICT,
	estudiante     TEXT NOT NULL,
	codigo         TEXT NOT NULL,
	fecha          TEXT NOT NULL,
	hora_inicio    TEXT NOT NULL,
	hora_fin       TEXT NOT NULL,
	motivo         TEXT NOT NULL DEFAULT '',
	estado         TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cancelada')),
	creado_en      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_reservas_busqueda ON reservas (ambiente_id, fecha, estado);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas (fecha);
`
	_, err := conn.Exec(schema)
	return err
}

func seed(conn *sql.DB) error {
	var n int
	if err := conn.QueryRow(`SELECT COUNT(*) FROM ambientes`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}

	ambientes := []struct {
		nombre, tipo, edificio, recursos, descripcion string
		capacidad, piso                               int
	}{
		{"Aula A-101", "aula", "Edificio A", "Proyector, Pizarra, Aire acondicionado", "Aula general para grupos grandes", 40, 1},
		{"Aula A-102", "aula", "Edificio A", "Pizarra, Bocinas", "Aula estándar de clase", 35, 1},
		{"Aula B-201", "aula", "Edificio B", "Proyector, Pizarra, Televisor", "Aula con equipo audiovisual", 30, 2},
		{"Laboratorio de Redes L-201", "laboratorio", "Edificio B", "Switches, Routers, Proyector", "Laboratorio de redes y telecomunicaciones", 24, 2},
		{"Laboratorio de Computación L-202", "laboratorio", "Edificio B", "30 PCs, Proyector, Pizarra", "Laboratorio de programación y bases de datos", 30, 2},
		{"Sala de Estudio S-301", "sala_estudio", "Edificio C", "Pizarra, Mesas grupales", "Espacio colaborativo para trabajo en grupo", 20, 3},
		{"Sala de Reuniones S-302", "sala_estudio", "Edificio C", "Televisor, Pizarra", "Sala para reuniones y defensas de trabajo", 12, 3},
	}

	for _, a := range ambientes {
		if _, err := conn.Exec(
			`INSERT INTO ambientes (nombre, tipo, capacidad, edificio, piso, recursos, estado, descripcion)
			 VALUES (?, ?, ?, ?, ?, ?, 'disponible', ?)`,
			a.nombre, a.tipo, a.capacidad, a.edificio, a.piso, a.recursos, a.descripcion,
		); err != nil {
			return err
		}
	}
	return nil
}

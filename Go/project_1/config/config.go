package config

import (
	"crypto/rand"
	"encoding/hex"
	"os"
	"path/filepath"
	"strconv"
)

type Config struct {
	Port    int
	DBPath  string
	Secreto []byte
}

func Load() Config {
	port := 3000
	if p := os.Getenv("PORT"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			port = v
		}
	}

	dbPath := os.Getenv("MAYU_DB")
	if dbPath == "" {
		dbPath = "data/mayu.db"
	}

	secreto, err := cargarOCrearSecreto(filepath.Join(filepath.Dir(dbPath), "secret.key"))
	if err != nil {
		panic("no se pudo cargar el secreto de sesión: " + err.Error())
	}

	return Config{Port: port, DBPath: dbPath, Secreto: secreto}
}

func cargarOCrearSecreto(ruta string) ([]byte, error) {
	if datos, err := os.ReadFile(ruta); err == nil && len(datos) >= 32 {
		return datos, nil
	}

	nuevo := make([]byte, 32)
	if _, err := rand.Read(nuevo); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filepath.Dir(ruta), 0o755); err != nil {
		return nil, err
	}
	if err := os.WriteFile(ruta, []byte(hex.EncodeToString(nuevo)), 0o600); err != nil {
		return nil, err
	}
	return []byte(hex.EncodeToString(nuevo)), nil
}

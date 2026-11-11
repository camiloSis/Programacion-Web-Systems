package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port   int
	DBPath string
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

	return Config{Port: port, DBPath: dbPath}
}

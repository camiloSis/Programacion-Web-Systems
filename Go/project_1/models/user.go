package models

const (
	RolAdmin      = "admin"
	RolEstudiante = "estudiante"
)

type User struct {
	ID      int    `json:"id"`
	Usuario string `json:"usuario"`
	Nombre  string `json:"nombre"`
	Rol     string `json:"rol"`
	Codigo  string `json:"codigo,omitempty"`
}

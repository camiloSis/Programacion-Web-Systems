package models

const (
	TipoAula         = "aula"
	TipoLaboratorio  = "laboratorio"
	TipoSalaEstudio  = "sala_estudio"
	EstadoDisp       = "disponible"
	EstadoMantenim   = "mantenimiento"
	ReservaActiva    = "activa"
	ReservaCancelada = "cancelada"
)

type Ambiente struct {
	ID          int    `json:"id"`
	Nombre      string `json:"nombre"`
	Tipo        string `json:"tipo"`
	Capacidad   int    `json:"capacidad"`
	Edificio    string `json:"edificio"`
	Piso        int    `json:"piso"`
	Recursos    string `json:"recursos"`
	Estado      string `json:"estado"`
	Descripcion string `json:"descripcion"`
}

type Reserva struct {
	ID             int    `json:"id"`
	AmbienteID     int    `json:"ambiente_id"`
	AmbienteNombre string `json:"ambiente_nombre"`
	Estudiante     string `json:"estudiante"`
	Codigo         string `json:"codigo"`
	Fecha          string `json:"fecha"`
	HoraInicio     string `json:"hora_inicio"`
	HoraFin        string `json:"hora_fin"`
	Motivo         string `json:"motivo"`
	Estado         string `json:"estado"`
	CreadoEn       string `json:"creado_en"`
}

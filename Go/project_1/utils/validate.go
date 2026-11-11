package utils

import (
	"regexp"
	"time"
)

var reHora = regexp.MustCompile(`^([01][0-9]|2[0-3]):[0-5][0-9]$`)
var reCodigo = regexp.MustCompile(`^[A-Za-z0-9-]{4,20}$`)

var tiposAmbiente = map[string]bool{"aula": true, "laboratorio": true, "sala_estudio": true}
var estadosAmbiente = map[string]bool{"disponible": true, "mantenimiento": true}
var estadosReserva = map[string]bool{"activa": true, "cancelada": true}

func EsTipoAmbiente(t string) bool   { return tiposAmbiente[t] }
func EsEstadoAmbiente(e string) bool { return estadosAmbiente[e] }
func EsEstadoReserva(e string) bool  { return estadosReserva[e] }

func FechaValida(f string) bool {
	_, err := time.Parse("2006-01-02", f)
	return err == nil
}

func FechaNoPasada(f string) bool {
	return f >= time.Now().Format("2006-01-02")
}

func HoraValida(h string) bool {
	return reHora.MatchString(h)
}

// HorarioValido valida formato, ventana de operación (06:00-22:00) y orden inicio < fin.
func HorarioValido(inicio, fin string) (bool, string) {
	if !HoraValida(inicio) || !HoraValida(fin) {
		return false, "Las horas deben tener formato HH:MM (ej: 08:30)"
	}
	if inicio < "06:00" || fin > "22:00" {
		return false, "El horario de reservas es de 06:00 a 22:00"
	}
	if inicio >= fin {
		return false, "La hora de inicio debe ser anterior a la hora de fin"
	}
	return true, ""
}

func CodigoEstudianteValido(c string) bool {
	return reCodigo.MatchString(c)
}

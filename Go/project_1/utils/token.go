package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var ErrSesionInvalida = errors.New("sesión inválida o expirada")

type Sesion struct {
	ID  int   `json:"id"`
	Exp int64 `json:"exp"`
}

func firma(secreto []byte, cuerpo string) []byte {
	mac := hmac.New(sha256.New, secreto)
	mac.Write([]byte(cuerpo))
	return mac.Sum(nil)
}

func FirmarSesion(s Sesion, secreto []byte) string {
	datos, _ := json.Marshal(s)
	cuerpo := base64.RawURLEncoding.EncodeToString(datos)
	sig := base64.RawURLEncoding.EncodeToString(firma(secreto, cuerpo))
	return cuerpo + "." + sig
}

func VerificarSesion(token string, secreto []byte) (Sesion, error) {
	var vacia Sesion
	partes := strings.Split(token, ".")
	if len(partes) != 2 {
		return vacia, ErrSesionInvalida
	}

	esperada := firma(secreto, partes[0])
	obtenida, err := base64.RawURLEncoding.DecodeString(partes[1])
	if err != nil || !hmac.Equal(esperada, obtenida) {
		return vacia, ErrSesionInvalida
	}

	datos, err := base64.RawURLEncoding.DecodeString(partes[0])
	if err != nil {
		return vacia, ErrSesionInvalida
	}

	var s Sesion
	if err := json.Unmarshal(datos, &s); err != nil {
		return vacia, ErrSesionInvalida
	}
	if s.Exp < time.Now().Unix() {
		return vacia, ErrSesionInvalida
	}
	return s, nil
}

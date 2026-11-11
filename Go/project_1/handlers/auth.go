package handlers

import (
	"net/http"
	"time"

	"mayu/middlewares"
	"mayu/utils"

	"github.com/gin-gonic/gin"
)

func (h *API) Login(c *gin.Context) {
	var body struct {
		Usuario  string `json:"usuario"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		fail(c, http.StatusBadRequest, "Usuario y contraseña son obligatorios")
		return
	}
	if body.Usuario == "" || body.Password == "" {
		fail(c, http.StatusBadRequest, "Usuario y contraseña son obligatorios")
		return
	}

	user, hash, err := h.Users.ObtenerPorUsuario(body.Usuario)
	if err != nil || !utils.CheckPassword(hash, body.Password) {
		fail(c, http.StatusUnauthorized, "Usuario o contraseña incorrectos")
		return
	}

	sesion := utils.Sesion{
		ID:  user.ID,
		Exp: time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	token := utils.FirmarSesion(sesion, h.Secreto)
	c.SetCookie("mayu_session", token, 7*24*3600, "/", "", false, true)

	ok(c, user)
}

func (h *API) Logout(c *gin.Context) {
	c.SetCookie("mayu_session", "", -1, "/", "", false, true)
	ok(c, gin.H{"message": "Sesión cerrada correctamente"})
}

func (h *API) Me(c *gin.Context) {
	user, okAuth := middlewares.UsuarioActual(c)
	if !okAuth {
		fail(c, http.StatusUnauthorized, "Debe iniciar sesión")
		return
	}
	ok(c, user)
}

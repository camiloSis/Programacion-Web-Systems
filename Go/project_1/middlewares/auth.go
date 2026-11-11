package middlewares

import (
	"net/http"

	"mayu/models"
	"mayu/store"
	"mayu/utils"

	"github.com/gin-gonic/gin"
)

const claveUsuario = "usuario"

type Auth struct {
	Secreto []byte
	Users   *store.UserStore
}

func UsuarioActual(c *gin.Context) (models.User, bool) {
	u, ok := c.Get(claveUsuario)
	if !ok {
		return models.User{}, false
	}
	user, ok := u.(models.User)
	return user, ok
}

func sesionInvalida(c *gin.Context, mensaje string) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"status":  "fail",
		"message": mensaje,
	})
}

// Require exige una sesión válida (cookie firmada + usuario existente).
func (a *Auth) Require() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("mayu_session")
		if err != nil || token == "" {
			sesionInvalida(c, "Debe iniciar sesión")
			return
		}

		sesion, err := utils.VerificarSesion(token, a.Secreto)
		if err != nil {
			sesionInvalida(c, "La sesión expiró o no es válida, inicie sesión de nuevo")
			return
		}

		user, err := a.Users.ObtenerPorID(sesion.ID)
		if err != nil {
			sesionInvalida(c, "La sesión expiró o no es válida, inicie sesión de nuevo")
			return
		}

		c.Set(claveUsuario, user)
		c.Next()
	}
}

// RequireAdmin exige un usuario autenticado con rol admin (usar después de Require).
func (a *Auth) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, ok := UsuarioActual(c)
		if !ok {
			sesionInvalida(c, "Debe iniciar sesión")
			return
		}
		if user.Rol != models.RolAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"status":  "fail",
				"message": "No tiene permisos para esta operación (se requiere rol admin)",
			})
			return
		}
		c.Next()
	}
}

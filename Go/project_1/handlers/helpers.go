package handlers

import (
	"net/http"
	"strconv"

	"mayu/store"

	"github.com/gin-gonic/gin"
)

type API struct {
	Ambientes *store.AmbienteStore
	Reservas  *store.ReservaStore
}

func ok(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": data})
}

func creado(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": data})
}

func fail(c *gin.Context, code int, message string) {
	c.JSON(code, gin.H{"status": "fail", "message": message})
}

func idValido(c *gin.Context) (int, bool) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		fail(c, http.StatusBadRequest, "El ID debe ser un número entero positivo")
		return 0, false
	}
	return id, true
}

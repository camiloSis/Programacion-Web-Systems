package middlewares

import (
	"log"
	"strings"

	"github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("panic recuperado: %v", err)
				c.AbortWithStatusJSON(500, gin.H{
					"status":  "error",
					"message": "Error interno del servidor",
				})
			}
		}()
		c.Next()
	}
}

func NoRoute() gin.HandlerFunc {
	return func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.JSON(404, gin.H{
				"status":  "fail",
				"message": "Ruta no encontrada: " + c.Request.Method + " " + c.Request.URL.Path,
			})
			return
		}
		c.JSON(404, gin.H{
			"status":  "fail",
			"message": "Recurso no encontrado",
		})
	}
}

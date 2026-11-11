package main

import (
	"fmt"
	"log"

	"mayu/config"
	"mayu/db"
	"mayu/handlers"
	"mayu/middlewares"
	"mayu/store"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	conn, err := db.Open(cfg.DBPath)
	if err != nil {
		log.Fatalf("error al abrir la base de datos: %v", err)
	}
	defer conn.Close()

	gin.SetMode(gin.ReleaseMode)

	r := gin.New()
	r.Use(middlewares.Logger(), middlewares.Recovery())

	h := &handlers.API{
		Ambientes: &store.AmbienteStore{DB: conn},
		Reservas:  &store.ReservaStore{DB: conn},
	}

	api := r.Group("/api")
	{
		api.GET("/ambientes", h.ListarAmbientes)
		api.POST("/ambientes", h.CrearAmbiente)
		api.GET("/ambientes/:id", h.ObtenerAmbiente)
		api.PUT("/ambientes/:id", h.ActualizarAmbiente)
		api.DELETE("/ambientes/:id", h.EliminarAmbiente)

		api.GET("/disponibilidad", h.AmbientesDisponibles)

		api.GET("/reservas", h.ListarReservas)
		api.POST("/reservas", h.CrearReserva)
		api.GET("/reservas/:id", h.ObtenerReserva)
		api.PUT("/reservas/:id", h.ActualizarReserva)
		api.PATCH("/reservas/:id/cancelar", h.CancelarReserva)

		api.GET("/estadisticas", h.Estadisticas)
	}

	r.GET("/", func(c *gin.Context) {
		c.File("public/index.html")
	})
	r.StaticFile("/style.css", "public/style.css")
	r.StaticFile("/script.js", "public/script.js")

	r.NoRoute(middlewares.NoRoute())

	log.Printf("Mayu corriendo en http://localhost:%d", cfg.Port)
	log.Printf("Frontend:      http://localhost:%d/", cfg.Port)
	log.Printf("API:           http://localhost:%d/api/ambientes", cfg.Port)

	if err := r.Run(fmt.Sprintf(":%d", cfg.Port)); err != nil {
		log.Fatalf("error al iniciar el servidor: %v", err)
	}
}

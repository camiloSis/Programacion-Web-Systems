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

	userStore := &store.UserStore{DB: conn}
	authMw := &middlewares.Auth{Secreto: cfg.Secreto, Users: userStore}

	h := &handlers.API{
		Ambientes: &store.AmbienteStore{DB: conn},
		Reservas:  &store.ReservaStore{DB: conn},
		Users:     userStore,
		Secreto:   cfg.Secreto,
	}

	api := r.Group("/api")
	{
		// autenticación
		api.POST("/auth/login", h.Login)
		api.POST("/auth/logout", h.Logout)
		api.GET("/auth/me", authMw.Require(), h.Me)

		// ambientes (lectura para todos; escritura solo admin)
		api.GET("/ambientes", authMw.Require(), h.ListarAmbientes)
		api.GET("/ambientes/:id", authMw.Require(), h.ObtenerAmbiente)
		api.POST("/ambientes", authMw.Require(), authMw.RequireAdmin(), h.CrearAmbiente)
		api.PUT("/ambientes/:id", authMw.Require(), authMw.RequireAdmin(), h.ActualizarAmbiente)
		api.DELETE("/ambientes/:id", authMw.Require(), authMw.RequireAdmin(), h.EliminarAmbiente)

		api.GET("/disponibilidad", authMw.Require(), h.AmbientesDisponibles)

		// reservas (el estudiante solo ve/modifica las suyas)
		api.GET("/reservas", authMw.Require(), h.ListarReservas)
		api.POST("/reservas", authMw.Require(), h.CrearReserva)
		api.GET("/reservas/:id", authMw.Require(), h.ObtenerReserva)
		api.PUT("/reservas/:id", authMw.Require(), h.ActualizarReserva)
		api.PATCH("/reservas/:id/cancelar", authMw.Require(), h.CancelarReserva)

		api.GET("/estadisticas", authMw.Require(), authMw.RequireAdmin(), h.Estadisticas)
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
	log.Printf("Login:         admin/admin123 | estudiante/estudiante123")

	if err := r.Run(fmt.Sprintf(":%d", cfg.Port)); err != nil {
		log.Fatalf("error al iniciar el servidor: %v", err)
	}
}

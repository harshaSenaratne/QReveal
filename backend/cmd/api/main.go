package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/harshaSenaratne/qreveal/backend/internal/config"
	"github.com/harshaSenaratne/qreveal/backend/internal/handlers"
	"github.com/harshaSenaratne/qreveal/backend/internal/middleware"
)

func main() {
	cfg := config.Load()

	router := chi.NewRouter()
	router.Use(middleware.RequestLogger)
	router.Use(middleware.Recovery)
	router.Use(middleware.SecurityHeaders)
	router.Use(middleware.CORS(cfg.AllowedOrigins))

	healthHandler := handlers.NewHealthHandler()
	qrHandler := handlers.NewQRHandler(cfg)

	router.Get("/health", healthHandler.Handle)
	router.Route("/api/v1", func(r chi.Router) {
		r.Post("/qr/extract", qrHandler.Extract)
	})

	server := &http.Server{
		Addr:              fmt.Sprintf(":%s", cfg.Port),
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       20 * time.Second,
		WriteTimeout:      20 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("QReveal API listening on port %s", cfg.Port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server failed: %v", err)
	}
}

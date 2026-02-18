package main

import (
	"tunorth-edms-backend/internal/adapters/handler"
	"tunorth-edms-backend/internal/adapters/repository"
	"tunorth-edms-backend/internal/core/services"
	"tunorth-edms-backend/pkg/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// 1. Infrastructure Setup
	database.ConnectDB()

	// 2. Dependency Injection (เชื่อมต่อ Layer ต่างๆ)
	// Repo -> Service -> Handler
	userRepo := repository.NewUserRepository(database.DB)
	authService := services.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)

	// 3. Setup Fiber App
	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // Allow Frontend (Next.js)
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// 4. Routes Definition
	api := app.Group("/api")
	v1 := api.Group("/v1")

	// Auth Routes
	v1.Post("/login", authHandler.Login)
	
	// Test Route
	v1.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// 5. Start Server
	app.Listen(":8080")
}
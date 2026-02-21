package main

import (
	"log"
	"tunorth-edms-backend/internal/adapters/handler"
	"tunorth-edms-backend/internal/adapters/notification"
	"tunorth-edms-backend/internal/adapters/repository"
	"tunorth-edms-backend/internal/core/services"
	"tunorth-edms-backend/pkg/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file")
	}

	database.ConnectDB()

	// Setup Layers (Dependency Injection)
	userRepo := repository.NewUserRepository(database.DB)
	authService := services.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)

	notifyService := notification.NewTelegramService()
	docRepo := repository.NewDocumentRepository(database.DB)
	
	// !! แก้ไขบรรทัดนี้ !!
	// ส่ง 3 arguments: docRepo, userRepo, notifyService
	docService := services.NewDocumentService(docRepo, userRepo, notifyService)
	
	docHandler := handler.NewDocumentHandler(docService)

	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Static("/uploads", "./uploads")

	// Routes
	api := app.Group("/api")
	v1 := api.Group("/v1")

	v1.Post("/login", authHandler.Login)

	v1.Post("/documents", docHandler.RegisterDocument)
	v1.Put("/documents/:id", docHandler.UpdateDocument)    // เพิ่ม Edit
	v1.Delete("/documents/:id", docHandler.DeleteDocument) // เพิ่ม Delete
	v1.Get("/documents", docHandler.GetDocuments)
	v1.Get("/documents/:id", docHandler.GetDocument)
	v1.Post("/documents/:id/route", docHandler.RouteDocument)
	v1.Post("/documents/:id/stamp", docHandler.StampDocument) // Route สำหรับ Stamp
	
	v1.Get("/departments", docHandler.GetDepartments)
	v1.Post("/documents/:id/distribute", docHandler.Distribute)

	log.Fatal(app.Listen(":8080"))
}
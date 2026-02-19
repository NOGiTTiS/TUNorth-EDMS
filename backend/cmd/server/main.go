package main

import (
	"tunorth-edms-backend/internal/adapters/handler"
	"tunorth-edms-backend/internal/adapters/repository"
	"tunorth-edms-backend/internal/core/services"
	"tunorth-edms-backend/pkg/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"log"
)

func main() {
	// 1. Load .env file (เพิ่มส่วนนี้)
    err := godotenv.Load()
    if err != nil {
        log.Println("Warning: Error loading .env file (might be running in Docker)")
    }

    // 2. Connect Database
    database.ConnectDB()

	// 2. Dependency Injection (เชื่อมต่อ Layer ต่างๆ)
	// Repo -> Service -> Handler
	userRepo := repository.NewUserRepository(database.DB)
	authService := services.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)

	docRepo := repository.NewDocumentRepository(database.DB)
    docService := services.NewDocumentService(docRepo)
    docHandler := handler.NewDocumentHandler(docService)

	// 3. Setup Fiber App
	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // Allow Frontend (Next.js)
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Serve Static Files (เพื่อให้เปิดดูไฟล์ PDF ได้)
    app.Static("/uploads", "./uploads")

	// 4. Routes Definition
	api := app.Group("/api")
	v1 := api.Group("/v1")

	// Auth Routes
	v1.Post("/login", authHandler.Login)

	// ++ Document Routes ++
    v1.Post("/documents", docHandler.RegisterDocument)        // API ลงรับหนังสือ
	v1.Get("/documents", docHandler.GetDocuments)			  
	v1.Get("/documents/:id", docHandler.GetDocument)          // ดูรายละเอียด
	v1.Post("/documents/:id/route", docHandler.RouteDocument) // เกษียรหนังสือ
	
	// Test Route
	v1.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// 5. Start Server
	app.Listen(":8080")
}
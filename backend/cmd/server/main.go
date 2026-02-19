package main

import (
	"log"
	"tunorth-edms-backend/internal/adapters/handler"
	"tunorth-edms-backend/internal/adapters/notification" // เพิ่ม
	"tunorth-edms-backend/internal/adapters/repository"
	"tunorth-edms-backend/internal/core/services"
	"tunorth-edms-backend/pkg/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: Error loading .env file")
	}

	// 2. Connect DB
	database.ConnectDB()

	// 3. Setup Layers
	userRepo := repository.NewUserRepository(database.DB)
	authService := services.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)

	// -- Document & Notification --
	notifyService := notification.NewTelegramService() // สร้าง Notifier
	
	docRepo := repository.NewDocumentRepository(database.DB)
	
	// !! จุดสำคัญ: ต้องส่ง notifyService เข้าไปเป็นตัวที่ 2 !!
	docService := services.NewDocumentService(docRepo, notifyService)
	
	docHandler := handler.NewDocumentHandler(docService)

	// 4. Setup Fiber
	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Static Files
	app.Static("/uploads", "./uploads")

	// 5. Routes
	api := app.Group("/api")
	v1 := api.Group("/v1")

	v1.Post("/login", authHandler.Login)

	v1.Post("/documents", docHandler.RegisterDocument)
	v1.Get("/documents", docHandler.GetDocuments)
	v1.Get("/documents/:id", docHandler.GetDocument)
	v1.Post("/documents/:id/route", docHandler.RouteDocument)
	
	v1.Get("/departments", docHandler.GetDepartments)
	v1.Post("/documents/:id/distribute", docHandler.Distribute)

	// 6. Start
	log.Fatal(app.Listen(":8080"))
}
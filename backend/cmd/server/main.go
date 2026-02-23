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

	// --- เพิ่ม User ---
	userRepo := repository.NewUserRepository(database.DB)
	authService := services.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)
	
	// --- เพิ่ม Settings ---
	settingRepo := repository.NewSettingRepository(database.DB)
	settingService := services.NewSettingService(settingRepo)
	settingHandler := handler.NewSettingHandler(settingService)

	// --- เพิ่ม Notification ---
	notifyService := notification.NewTelegramService(settingRepo) 

	// --- เพิ่ม Document ---
	docRepo := repository.NewDocumentRepository(database.DB)
	docService := services.NewDocumentService(docRepo, userRepo, settingRepo, notifyService)
	docHandler := handler.NewDocumentHandler(docService)

	// --- เพิ่ม User ---
	userService := services.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	
	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Static("/uploads", "./uploads")

	// --- Route API ---
	api := app.Group("/api")
	v1 := api.Group("/v1")

	// --- Route Auth ---
	v1.Post("/login", authHandler.Login)
	v1.Post("/register", userHandler.RegisterUser)

	v1.Get("/departments", docHandler.GetDepartments) 
    v1.Get("/telegram/latest-id", settingHandler.GetLatestTelegramChatID) 

	// --- Route Document ---
	v1.Post("/documents", docHandler.RegisterDocument)
	v1.Get("/documents", docHandler.GetDocuments)
	
	// !!! ย้ายบรรทัดนี้มาไว้ข้างบน !!!
	v1.Get("/documents/next-no", docHandler.GetNextNumber) 

	// Route ที่รับ ID ต้องอยู่ข้างล่างเสมอ
	v1.Get("/documents/:id", docHandler.GetDocument)
	v1.Put("/documents/:id", docHandler.UpdateDocument)
	v1.Delete("/documents/:id", docHandler.DeleteDocument)
	v1.Post("/documents/:id/route", docHandler.RouteDocument)
	v1.Post("/documents/:id/stamp", docHandler.StampDocument)
	v1.Post("/documents/:id/distribute", docHandler.Distribute)
	v1.Post("/documents/:id/forward-head", docHandler.ForwardToHead)
	v1.Post("/documents/:id/forward-deputy", docHandler.ForwardToDeputy)
	v1.Post("/documents/:id/deputy-sign", docHandler.DeputySign)
	v1.Post("/documents/:id/complete", docHandler.CompleteDocument)

	// --- Route Department ---
	v1.Post("/departments", docHandler.CreateDepartment)
	v1.Put("/departments/:id", docHandler.UpdateDepartment)
	v1.Delete("/departments/:id", docHandler.DeleteDepartment)

	// --- Routes สำหรับ User ---
	v1.Get("/users", userHandler.GetUsers)
	v1.Post("/users", userHandler.CreateUser)
	v1.Put("/users/:id", userHandler.UpdateUser)
	v1.Delete("/users/:id", userHandler.DeleteUser)
	v1.Put("/profile/:id", userHandler.UpdateProfile)

	// --- Route Settings ---
	v1.Get("/settings", settingHandler.GetSettings)
	v1.Put("/settings", settingHandler.UpdateSettings)
	v1.Post("/settings/upload", settingHandler.UploadImage)
	log.Fatal(app.Listen(":8080"))
}
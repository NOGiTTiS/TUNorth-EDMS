package database

import (
	"fmt"
	"log"
	"os"

	"tunorth-edms-backend/internal/core/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	// อ่านค่าจาก Environment Variable (ที่ตั้งใน docker-compose.yml)
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Bangkok",
		host, user, password, dbname, port)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // แสดง SQL Log ตอน Dev
	})

	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	log.Println("Database Connected Successfully!")
	
	// Auto Migrate: สร้างตารางให้อัตโนมัติ
	log.Println("Running Migrations...")
	err = DB.AutoMigrate(
		&domain.User{},
		&domain.Department{},
		&domain.Document{},
		&domain.DocumentRoute{},
		&domain.SystemSetting{},
	)
	
	if err != nil {
		log.Fatal("Migration Failed: \n", err)
	}
	
	log.Println("Migrations Completed!")

	SeedData(DB)
}
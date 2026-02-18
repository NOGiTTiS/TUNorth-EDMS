package database

import (
	"log"
	"tunorth-edms-backend/internal/core/domain"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedData(db *gorm.DB) {
	// 1. Seed Departments (รายชื่อฝ่าย)
	var count int64
	db.Model(&domain.Department{}).Count(&count)
	
	if count == 0 {
		departments := []domain.Department{
			{Name: "บริหารงานงบประมาณ", Code: "BUD"},
			{Name: "บริหารงานวิชาการ", Code: "ACA"},
			{Name: "บริหารงานบุคคล", Code: "PER"},
			{Name: "บริหารงานทั่วไป", Code: "GEN"},
			{Name: "บริหารงานกิจการนักเรียน", Code: "STU"},
		}
		db.Create(&departments)
		log.Println("Seeded Departments")
	}

	// 2. Seed Users (Admin & Director)
	db.Model(&domain.User{}).Count(&count)
	if count == 0 {
		// Hash Password "123456"
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("123456"), bcrypt.DefaultCost)
		
		users := []domain.User{
			// ธุรการกลาง (Admin)
			{
				Username: "admin",
				Password: string(hashedPassword),
				FullName: "เจ้าหน้าที่ธุรการกลาง",
				Role:     domain.RoleAdminCentral,
				Position: "เจ้าหน้าที่ธุรการ",
			},
			// ผู้อำนวยการ (Director)
			{
				Username: "director",
				Password: string(hashedPassword),
				FullName: "นายยงค์ยุทธ รุ่งแจ้ง",
				Role:     domain.RoleDirector,
				Position: "ผู้อำนวยการโรงเรียนเตรียมอุดมศึกษา ภาคเหนือ",
			},
		}
		db.Create(&users)
		log.Println("Seeded Initial Users (admin/123456, director/123456)")
	}
}
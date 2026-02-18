package domain

import "gorm.io/gorm"

type UserRole string

const (
	RoleAdminCentral  UserRole = "admin_central"  // ธุรการกลาง
	RoleDirector      UserRole = "director"       // ผู้อำนวยการ
	RoleDeputy        UserRole = "deputy"         // รอง ผอ.
	RoleAdminDept     UserRole = "admin_dept"     // ธุรการฝ่าย
	RoleHead          UserRole = "head"           // หัวหน้างาน
)

type User struct {
	gorm.Model
	Username     string   `gorm:"uniqueIndex;not null" json:"username"`
	Password     string   `gorm:"not null" json:"-"` // ไม่ส่ง password กลับไปหน้าบ้าน
	FullName     string   `gorm:"not null" json:"full_name"`
	Role         UserRole `gorm:"type:varchar(20);not null" json:"role"`
	Position     string   `json:"position"`        // เช่น ผู้อำนวยการโรงเรียน...
	DepartmentID *uint    `json:"department_id"`   // สังกัดฝ่ายไหน (ถ้ามี)
	Department   *Department `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	SignaturePath string  `json:"signature_path"`  // Path รูปภาพลายเซ็น (สำหรับแปะใน PDF)
}

type Department struct {
	gorm.Model
	Name string `gorm:"unique;not null" json:"name"`
	Code string `json:"code"` // รหัสฝ่าย (ถ้ามี)
}
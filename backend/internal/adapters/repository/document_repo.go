package repository

import (
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"gorm.io/gorm"
)

type documentRepo struct {
	db *gorm.DB
}

func NewDocumentRepository(db *gorm.DB) ports.DocumentRepository {
	return &documentRepo{db: db}
}

func (r *documentRepo) Create(doc *domain.Document) error {
	return r.db.Create(doc).Error
}

func (r *documentRepo) FindAll() ([]domain.Document, error) {
	var docs []domain.Document
	// ดึงข้อมูลทั้งหมด เรียงจากใหม่ไปเก่า (desc) และ Preload User ที่สร้าง
	err := r.db.Preload("CreatedBy").Order("created_at desc").Find(&docs).Error
	return docs, err
}

func (r *documentRepo) FindByID(id uint) (*domain.Document, error) {
	var doc domain.Document
	// Preload Routings เพื่อดูประวัติการส่ง, Preload Sender ของ Route
	err := r.db.Preload("CreatedBy").
		Preload("Routings.Sender"). // ดึงชื่อคนส่ง
		Preload("Routings.Receiver"). // ดึงชื่อคนรับ
		First(&doc, id).Error
	return &doc, err
}

func (r *documentRepo) UpdateStatus(id uint, status domain.DocStatus) error {
	return r.db.Model(&domain.Document{}).Where("id = ?", id).Update("status", status).Error
}

func (r *documentRepo) CreateRoute(route *domain.DocumentRoute) error {
	return r.db.Create(route).Error
}

func (r *documentRepo) GetAllDepartments() ([]domain.Department, error) {
	var depts []domain.Department
	err := r.db.Find(&depts).Error
	return depts, err
}

func (r *documentRepo) GetDepartmentsByIDs(ids []uint) ([]domain.Department, error) {
	var depts []domain.Department
	err := r.db.Where("id IN ?", ids).Find(&depts).Error
	return depts, err
}

func (r *documentRepo) Update(doc *domain.Document) error {
	// ใช้ gorm.DB.Save() ซึ่งจะอัปเดตทุก field ของ struct ที่ส่งเข้ามา
	return r.db.Save(doc).Error
}

func (r *documentRepo) Delete(id uint) error {
	// GORM ทำ Soft Delete (อัปเดต deleted_at) ไม่ได้ลบออกจาก Harddisk จริงๆ
	return r.db.Delete(&domain.Document{}, id).Error
}

func (r *documentRepo) FindLastDocument() (*domain.Document, error) {
	var doc domain.Document
	// เรียงตาม ID ล่าสุด (Desc) เอาแค่ 1 ตัว
	err := r.db.Order("id desc").First(&doc).Error
	return &doc, err
}
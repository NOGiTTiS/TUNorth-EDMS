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
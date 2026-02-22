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

func (r *documentRepo) SearchDocuments(q ports.DocumentQuery) (*ports.PaginatedDocument, error) {
	var docs []domain.Document
	var total int64

	db := r.db.Model(&domain.Document{})

	// 1. ค้นหาจากข้อความ (เรื่อง, เลขรับ, เลขหนังสือ, จาก)
	if q.Search != "" {
		searchTerm := "%" + q.Search + "%"
		db = db.Where("subject ILIKE ? OR receive_no ILIKE ? OR doc_no ILIKE ? OR \"from\" ILIKE ?", searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// 2. กรองจาก ปี/เดือน (PostgreSQL ใช้ EXTRACT)
	if q.Year > 0 {
		db = db.Where("EXTRACT(YEAR FROM receive_date) = ?", q.Year)
	}
	if q.Month > 0 {
		db = db.Where("EXTRACT(MONTH FROM receive_date) = ?", q.Month)
	}

	// นับจำนวนทั้งหมดที่ตรงเงื่อนไขก่อน
	db.Count(&total)

	// 3. แบ่งหน้า (Pagination)
	if q.Page < 1 { q.Page = 1 }
	if q.Limit < 1 { q.Limit = 20 }
	offset := (q.Page - 1) * q.Limit

	// ดึงข้อมูลจริง
	err := db.Preload("CreatedBy").Order("created_at desc").Limit(q.Limit).Offset(offset).Find(&docs).Error

	// คำนวณจำนวนหน้าทั้งหมด
	totalPages := int((total + int64(q.Limit) - 1) / int64(q.Limit))

	return &ports.PaginatedDocument{
		Data:       docs,
		Total:      total,
		Page:       q.Page,
		TotalPages: totalPages,
	}, err
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
	// 1. ลบประวัติการเดินหนังสือ (Routes) ที่เกี่ยวข้องกับหนังสือนั้นออกก่อนแบบถาวร
	r.db.Unscoped().Where("doc_id = ?", id).Delete(&domain.DocumentRoute{})

	// 2. ลบข้อมูลหนังสือหลักออกด้วยคำสั่ง Unscoped() ซึ่งหมายถึง Hard Delete (ลบถาวรจาก DB)
	return r.db.Unscoped().Delete(&domain.Document{}, id).Error
}

func (r *documentRepo) FindLastDocument() (*domain.Document, error) {
	var doc domain.Document
	// เรียงตาม ID ล่าสุด (Desc) เอาแค่ 1 ตัว
	err := r.db.Order("id desc").First(&doc).Error
	return &doc, err
}

func (r *documentRepo) CreateDepartment(dept *domain.Department) error {
	return r.db.Create(dept).Error
}
func (r *documentRepo) UpdateDepartment(dept *domain.Department) error {
	return r.db.Save(dept).Error
}
func (r *documentRepo) DeleteDepartment(id uint) error {
	return r.db.Delete(&domain.Department{}, id).Error
}
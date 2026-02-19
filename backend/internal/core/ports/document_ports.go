package ports

import (
	"mime/multipart"
	"tunorth-edms-backend/internal/core/domain"
)

type DocumentRepository interface {
	Create(doc *domain.Document) error
	FindAll() ([]domain.Document, error)
	FindByID(id uint) (*domain.Document, error) // เพิ่ม: หาหนังสือตาม ID
	UpdateStatus(id uint, status domain.DocStatus) error // เพิ่ม: อัปเดตสถานะ
	CreateRoute(route *domain.DocumentRoute) error // เพิ่ม: บันทึกประวัติการส่ง
	GetAllDepartments() ([]domain.Department, error) // เพิ่ม
    GetDepartmentsByIDs(ids []uint) ([]domain.Department, error)
}

type DocumentService interface {
	// รับข้อมูล File Header มาด้วยเพื่อ Save ลง Disk
	RegisterDocument(doc *domain.Document, file *multipart.FileHeader) error
	GetAllDocuments() ([]domain.Document, error) 
	GetDocumentByID(id uint) (*domain.Document, error) // เพิ่ม
	KasienDocument(docID uint, userID uint, req RouteRequest) error
	GetDepartments() ([]domain.Department, error) // เพิ่ม
    DistributeDocument(docID uint, adminID uint, deptIDs []uint) error
}

type RouteRequest struct {
	Action      domain.ActionType `json:"action"`       // ทราบ, อนุมัติ...
	CommandNote string            `json:"command_note"` // ข้อความสั่งการ
	ToUserID    *uint             `json:"to_user_id"`   // ส่งต่อใคร (ถ้ามี)
	ToDeptID    *uint             `json:"to_dept_id"`   // ส่งต่อฝ่ายไหน (ถ้ามี)
}
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
	Update(doc *domain.Document) error
}

type DocumentService interface {
	// รับข้อมูล File Header มาด้วยเพื่อ Save ลง Disk
	RegisterDocument(doc *domain.Document, file *multipart.FileHeader) error
	GetAllDocuments() ([]domain.Document, error) 
	GetDocumentByID(id uint) (*domain.Document, error) // เพิ่ม
	KasienDocument(docID uint, userID uint, req RouteRequest) error
	GetDepartments() ([]domain.Department, error) // เพิ่ม
    DistributeDocument(docID uint, adminID uint, deptIDs []uint) error
	StampAndSign(docID uint, adminID uint, deptIDs []uint, signatureData string, noteToDirector string) error 
}

type RouteRequest struct {
	Action      string `json:"action"`
	CommandNote string `json:"command_note"`
	SignatureData string `json:"signature_data"`
}
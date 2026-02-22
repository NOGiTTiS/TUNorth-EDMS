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
	Delete(id uint) error
	FindLastDocument() (*domain.Document, error)
	CreateDepartment(dept *domain.Department) error
	UpdateDepartment(dept *domain.Department) error
	DeleteDepartment(id uint) error
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
	UpdateDocumentInfo(id uint, req UpdateDocRequest) error // เพิ่ม: แก้ไขข้อมูล
	DeleteDocument(id uint) error
	GetNextReceiveNumber() (string, error)
	CreateDepartment(req domain.Department) error
	UpdateDepartment(id uint, req domain.Department) error
	DeleteDepartment(id uint) error
}

// สร้าง Struct สำหรับรับค่าการแก้ไขข้อมูล
type UpdateDocRequest struct {
	ReceiveNo   string `json:"receive_no"`
	ReceiveDate string `json:"receive_date"` // ส่งมาเป็น "YYYY-MM-DD"
	DocNo       string `json:"doc_no"`
	DocDate     string `json:"doc_date"`
	From        string `json:"from"`
	To          string `json:"to"`
	Subject     string `json:"subject"`
}

type RouteRequest struct {
	Action      string `json:"action"`
	CommandNote string `json:"command_note"`
	SignatureData string `json:"signature_data"`
}
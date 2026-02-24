package ports

import (
	"mime/multipart"
	"tunorth-edms-backend/internal/core/domain"
)

type DocumentQuery struct {
	Search string
	Year   int
	Month  int
	Page   int
	Limit  int
	FilterDeptID uint
}

type PaginatedDocument struct {
	Data       []domain.Document `json:"data"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	TotalPages int               `json:"total_pages"`
}

type DocumentRepository interface {
	Create(doc *domain.Document) error
	SearchDocuments(query DocumentQuery) (*PaginatedDocument, error) 
	FindByID(id uint) (*domain.Document, error)
	FindLastDocument() (*domain.Document, error)
	UpdateStatus(id uint, status domain.DocStatus) error // เพิ่ม: อัปเดตสถานะ
	CreateRoute(route *domain.DocumentRoute) error // เพิ่ม: บันทึกประวัติการส่ง
	GetAllDepartments() ([]domain.Department, error) // เพิ่ม
    GetDepartmentsByIDs(ids []uint) ([]domain.Department, error)
	Update(doc *domain.Document) error
	Delete(id uint) error
	CreateDepartment(dept *domain.Department) error
	UpdateDepartment(dept *domain.Department) error
	DeleteDepartment(id uint) error
	IsDocumentInDept(docID uint, deptID uint) (bool, error)
}

type DocumentService interface {
	// รับข้อมูล File Header มาด้วยเพื่อ Save ลง Disk
	RegisterDocument(doc *domain.Document, file *multipart.FileHeader) error
	SearchDocuments(userID uint, query DocumentQuery) (*PaginatedDocument, error)
	GetDocumentByID(id uint) (*domain.Document, error)
	KasienDocument(docID uint, userID uint, req RouteRequest) error
	GetDepartments() ([]domain.Department, error)
    DistributeDocument(docID uint, adminID uint, deptIDs []uint) error
	StampAndSign(docID uint, adminID uint, deptIDs []uint, signatureData string, noteToDirector string) error 
	UpdateDocumentInfo(id uint, req UpdateDocRequest) error
	DeleteDocument(id uint) error
	GetNextReceiveNumber() (string, error)
	CreateDepartment(req domain.Department) error
	UpdateDepartment(id uint, req domain.Department) error
	DeleteDepartment(id uint) error
	ForwardToHead(docID uint, senderID uint, headIDs []uint) error
	ForwardToDeputy(docID uint, senderID uint, note string) error
	DeputySign(docID uint, userID uint, req RouteRequest) error
	CompleteDocument(docID uint, userID uint) error
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
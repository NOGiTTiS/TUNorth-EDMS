package ports

import (
	"mime/multipart"
	"tunorth-edms-backend/internal/core/domain"
)

type DocumentRepository interface {
	Create(doc *domain.Document) error
	FindAll() ([]domain.Document, error)
	// FindByID(id uint) (*domain.Document, error)
}

type DocumentService interface {
	// รับข้อมูล File Header มาด้วยเพื่อ Save ลง Disk
	RegisterDocument(doc *domain.Document, file *multipart.FileHeader) error
	GetAllDocuments() ([]domain.Document, error) 
}
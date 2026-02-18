package ports

import (
	"mime/multipart"
	"tunorth-edms-backend/internal/core/domain"
)

type DocumentRepository interface {
	Create(doc *domain.Document) error
	// ในอนาคตเพิ่ม FindAll, FindByID ได้ที่นี่
}

type DocumentService interface {
	// รับข้อมูล File Header มาด้วยเพื่อ Save ลง Disk
	RegisterDocument(doc *domain.Document, file *multipart.FileHeader) error
}
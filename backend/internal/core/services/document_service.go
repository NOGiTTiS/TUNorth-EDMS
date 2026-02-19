package services

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"github.com/google/uuid"
)

type documentService struct {
	repo ports.DocumentRepository
}

func NewDocumentService(repo ports.DocumentRepository) ports.DocumentService {
	return &documentService{repo: repo}
}

func (s *documentService) RegisterDocument(doc *domain.Document, file *multipart.FileHeader) error {
	// 1. จัดการไฟล์ (Upload File)
	uploadDir := "./uploads/documents"
	// สร้าง folder ถ้ายังไม่มี
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	// ตั้งชื่อไฟล์ใหม่ป้องกันชื่อซ้ำ (UUID + นามสกุลเดิม)
	ext := filepath.Ext(file.Filename)
	newFileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	filePath := filepath.Join(uploadDir, newFileName)

	// *หมายเหตุ: ใน Hexagonal ที่เคร่งครัด การ Save File ควรแยกเป็น Adapter อีกตัว (StorageAdapter)
	// แต่เพื่อความกระชับในโปรเจคนี้ ขออนุญาต Save ตรงๆ ผ่าน Fiber Utils ใน Handler หรือใช้ lib มาตรฐาน
	// ในที่นี้ Service จะกำหนด Path แต่การ Save จริงเราจะให้ Handler ช่วย (หรือใช้ gin/fiber context save)
	// เพื่อให้ Service Pure Go ที่สุด เราจะเก็บแค่ Path ครับ ส่วนการ Save จริงเดี๋ยวไปทำใน Handler
	
	doc.FilePath = filePath
	doc.Status = domain.StatusPendingDirector // สถานะเริ่มต้น: รอ ผอ. สั่งการ
	
	// 2. บันทึกข้อมูลลง Database
	return s.repo.Create(doc)
}

func (s *documentService) GetAllDocuments() ([]domain.Document, error) {
	return s.repo.FindAll()
}
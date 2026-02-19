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

func (s *documentService) GetDocumentByID(id uint) (*domain.Document, error) {
	return s.repo.FindByID(id)
}

func (s *documentService) KasienDocument(docID uint, userID uint, req ports.RouteRequest) error {
	// 1. ตรวจสอบว่าหนังสือมีอยู่จริง
	doc, err := s.repo.FindByID(docID)
	if err != nil {
		return err
	}

	// 2. สร้าง Record การเดินหนังสือ (DocumentRoute)
	route := domain.DocumentRoute{
		DocID:       docID,
		SenderID:    userID,
		ActionType:  req.Action,
		CommandNote: req.CommandNote,
		IsRead:      true,
		// ReceiverID: req.ToUserID, // เวอร์ชั่นนี้เราส่งกลับธุรการกลางก่อนเสมอตาม Flow
		// หรือถ้าจะส่งต่อให้คนอื่นตาม Req ก็ใส่ตรงนี้
	}
	
	// *Logic สำคัญตาม Flow เดิม:*
	// ผอ. สั่งการ -> ส่งกลับ ธุรการกลาง -> ธุรการกลาง แจกจ่าย ฝ่าย
	
	// กำหนดสถานะใหม่ตาม Role ของผู้ส่ง (ในที่นี้คือ ผอ.)
	var newStatus domain.DocStatus

	// ถ้าคนสั่งการคือ ผู้อำนวยการ (RoleDirector)
	// ให้เปลี่ยนสถานะเป็น "DirectorSigned" (ผอ.สั่งแล้ว)
	// (ในโค้ดจริงควรเช็ค Role จาก UserID แต่เพื่อความกระชับสมมติว่า Flow นี้เรียกโดย ผอ.)
	newStatus = domain.StatusDirectorSigned

	// บันทึก Route
	if err := s.repo.CreateRoute(&route); err != nil {
		return err
	}

	// 3. อัปเดตสถานะเอกสารหลัก
	return s.repo.UpdateStatus(doc.ID, newStatus)
}
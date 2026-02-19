package services

import (
	"fmt"
	"mime/multipart"
	"os"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"
)

type documentService struct {
	repo     ports.DocumentRepository
	notifier ports.NotificationService // ต้องมี Field นี้
}

// Constructor รับ 2 arguments (Repo, Notifier)
func NewDocumentService(repo ports.DocumentRepository, notifier ports.NotificationService) ports.DocumentService {
	return &documentService{
		repo:     repo,
		notifier: notifier,
	}
}

func (s *documentService) RegisterDocument(doc *domain.Document, file *multipart.FileHeader) error {
	// ... (Code เดิม หรือ Copy จาก Part 5)
	// เพื่อความกระชับ: ใส่ Path ที่ Handler จะ Save ลงไป
	doc.FilePath = fmt.Sprintf("./uploads/documents/%s", file.Filename) // ตัวอย่าง (Handler จะแก้ Path จริงอีกที)
	doc.Status = domain.StatusPendingDirector
	return s.repo.Create(doc)
}

func (s *documentService) GetAllDocuments() ([]domain.Document, error) {
	return s.repo.FindAll()
}

func (s *documentService) GetDocumentByID(id uint) (*domain.Document, error) {
	return s.repo.FindByID(id)
}

func (s *documentService) KasienDocument(docID uint, userID uint, req ports.RouteRequest) error {
	doc, err := s.repo.FindByID(docID)
	if err != nil {
		return err
	}

	route := domain.DocumentRoute{
		DocID:       docID,
		SenderID:    userID,
		ActionType:  req.Action,
		CommandNote: req.CommandNote,
		IsRead:      true,
	}
	
	newStatus := domain.StatusDirectorSigned

	if err := s.repo.CreateRoute(&route); err != nil {
		return err
	}

	return s.repo.UpdateStatus(doc.ID, newStatus)
}

func (s *documentService) GetDepartments() ([]domain.Department, error) {
	return s.repo.GetAllDepartments()
}

func (s *documentService) DistributeDocument(docID uint, adminID uint, deptIDs []uint) error {
	doc, err := s.repo.FindByID(docID)
	if err != nil {
		return err
	}

	targetDepts, err := s.repo.GetDepartmentsByIDs(deptIDs)
	if err != nil {
		return err
	}

	for _, dept := range targetDepts {
		route := domain.DocumentRoute{
			DocID:          docID,
			SenderID:       adminID,
			ReceiverDeptID: &dept.ID,
			ActionType:     "assigned",
			IsRead:         false,
		}
		s.repo.CreateRoute(&route)

		// ใช้ s.notifier ได้แล้ว เพราะประกาศใน Struct แล้ว
		if s.notifier != nil {
			msg := fmt.Sprintf("📢 *งานเข้าใหม่ (%s)*\n\n📄 เรื่อง: %s\n", dept.Name, doc.Subject)
			// ถ้า dept.TelegramChatID ว่าง ให้ส่งหา Debug Token
			chatID := dept.TelegramChatID
			if chatID == "" {
				chatID = os.Getenv("TELEGRAM_CHAT_ID_DEBUG")
			}
			s.notifier.SendMessage(chatID, msg)
		}
	}

	return s.repo.UpdateStatus(docID, domain.StatusDistributed)
}
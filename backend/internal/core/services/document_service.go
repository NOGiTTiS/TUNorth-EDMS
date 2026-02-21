package services

import (
	"encoding/base64"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"github.com/google/uuid"
	"github.com/signintech/gopdf"
)

type documentService struct {
	repo     ports.DocumentRepository
	userRepo ports.UserRepository
	notifier ports.NotificationService
}

// NewDocumentService สร้าง Service พร้อมเชื่อมต่อ Repository และ Notification
func NewDocumentService(repo ports.DocumentRepository, userRepo ports.UserRepository, notifier ports.NotificationService) ports.DocumentService {
	return &documentService{
		repo:     repo,
		userRepo: userRepo,
		notifier: notifier,
	}
}

// RegisterDocument ลงรับหนังสือเบื้องต้น (บันทึกไฟล์ต้นฉบับและข้อมูลลง DB)
func (s *documentService) RegisterDocument(doc *domain.Document, file *multipart.FileHeader) error {
	uploadDir := "./uploads/documents"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	ext := filepath.Ext(file.Filename)
	newFileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	filePath := filepath.Join(uploadDir, newFileName)

	doc.FilePath = filePath
	doc.Status = "draft" // รอกระบวนการประทับตราและลงนาม

	return s.repo.Create(doc)
}

// StampAndSign กระบวนการประทับตรา 2 จุด และลงนามธุรการลงใน PDF
func (s *documentService) StampAndSign(docID uint, adminID uint, deptIDs []uint, signatureData string, noteToDirector string) error {
	// 1. ดึงข้อมูลจากฐานข้อมูล
	doc, err := s.repo.FindByID(docID)
	if err != nil {
		return err
	}

	adminUser, err := s.userRepo.FindByID(adminID)
	if err != nil {
		return err
	}

	allDepts, _ := s.repo.GetAllDepartments()

	// 2. เริ่มต้นสร้าง PDF โดยใช้ gopdf
	pdf := gopdf.GoPdf{}
	pdf.Start(gopdf.Config{PageSize: *gopdf.PageSizeA4}) // A4 (595.28 x 841.89)

	// Import หน้าแรกของ PDF ต้นฉบับ
	tpl := pdf.ImportPage(doc.FilePath, 1, "/MediaBox")
	pdf.AddPage()
	pdf.UseImportedTemplate(tpl, 0, 0, 595, 842)

	// โหลดฟอนต์ภาษาไทย (ไฟล์ต้องอยู่ที่ backend/assets/fonts/Prompt-Regular.ttf)
	err = pdf.AddTTFFont("prompt", "./assets/fonts/Prompt-Regular.ttf")
	if err != nil {
		return fmt.Errorf("ไม่สามารถโหลดฟอนต์ภาษาไทยได้: %v", err)
	}

	// =========================================================
	// ตั้งค่าสีน้ำเงินสำหรับตราประทับ (สีน้ำเงินหมึกประทับ)
	// =========================================================
	pdf.SetStrokeColor(0, 0, 180) // สีของเส้นขอบ (RGB)
	pdf.SetTextColor(0, 0, 180)   // สีของตัวอักษร (RGB)
	pdf.SetFillColor(245, 245, 245)

	// =========================================================
	// ส่วนที่ 1: ตราประทับเลขรับ (มุมบนขวา - เลียนแบบภาพ 5.png)
	// =========================================================
	pdf.SetLineWidth(1)
	startX, startY := 390.0, 30.0
	pdf.RectFromUpperLeftWithStyle(startX, startY, 185.0, 165.0, "D") // วาดกรอบสี่เหลี่ยม

	pdf.SetFont("prompt", "", 10)
	pdf.SetXY(startX+10, startY+15)
	pdf.Cell(nil, "โรงเรียนเตรียมอุดมศึกษา ภาคเหนือ")

	pdf.SetXY(startX+10, startY+35)
	pdf.Cell(nil, fmt.Sprintf("เลขรับ      %s", doc.ReceiveNo))

	// จัดการรูปแบบวันที่ไทย (พ.ศ.)
	thaiDate := fmt.Sprintf("%02d/%02d/%d", doc.ReceiveDate.Day(), doc.ReceiveDate.Month(), doc.ReceiveDate.Year()+543)
	pdf.SetXY(startX+10, startY+55)
	pdf.Cell(nil, fmt.Sprintf("วันที่        %s", thaiDate))

	pdf.SetXY(startX+10, startY+75)
	pdf.Cell(nil, fmt.Sprintf("เวลา        %s น.", time.Now().Format("15:04")))

	// วาด Checkbox สำหรับฝ่ายต่างๆ
	pdf.SetFont("prompt", "", 8)
	deptY := startY + 95.0
	for _, dept := range allDepts {
		// วาดช่องสี่เหลี่ยมเล็กๆ
		pdf.RectFromUpperLeftWithStyle(startX+10, deptY, 8, 8, "D")

		// ติ๊กเครื่องหมาย / ถ้าเป็นฝ่ายที่ถูกเลือก
		for _, sid := range deptIDs {
			if dept.ID == sid {
				pdf.SetXY(startX+11, deptY) //-2
				pdf.Cell(nil, "/")
			}
		}

		pdf.SetXY(startX+25, deptY) //+7
		pdf.Cell(nil, dept.Name)
		deptY += 14 // เว้นบรรทัด //14
	}

	// =========================================================
	// ส่วนที่ 2: ตราประทับเสนอ ผอ. (ด้านล่าง - เลียนแบบภาพ 1.png)
	// =========================================================
	propX, propY := 50.0, 450.0
	pdf.RectFromUpperLeftWithStyle(propX, propY, 230.0, 120.0, "D") // วาดกรอบ

	pdf.SetFont("prompt", "", 11)
	pdf.SetXY(propX+10, propY+18)
	pdf.Cell(nil, "เรียน  ผู้อำนวยการโรงเรียน")

	pdf.SetXY(propX+25, propY+40)
	pdf.SetFont("prompt", "", 10)
	pdf.Cell(nil, "เพื่อโปรด  "+noteToDirector) // ใช้ข้อความจากหน้าบ้าน

	// วาดลายเซ็นธุรการ (Signature Pad Base64)
	if signatureData != "" {
		rawImgData := strings.Split(signatureData, ",")[1]
		dec, err := base64.StdEncoding.DecodeString(rawImgData)
		if err == nil {
			imgH, err := gopdf.ImageHolderByBytes(dec)
			if err == nil {
				// แปะภาพลายเซ็น (X, Y, W, H)
				pdf.ImageByHolder(imgH, propX+75, propY+50, &gopdf.Rect{W: 80, H: 40})
			}
		}
	}

	// เขียนชื่อ-ตำแหน่งธุรการ
	pdf.SetXY(propX+60, propY+95)
	pdf.Cell(nil, fmt.Sprintf("( %s )", adminUser.FullName))
	pdf.SetXY(propX+80, propY+108)
	pdf.Cell(nil, "เจ้าหน้าที่ธุรการ")

	// 3. บันทึกไฟล์ใหม่และอัปเดตสถานะ
	stampedPath := strings.Replace(doc.FilePath, ".pdf", "_final.pdf", 1)
	err = pdf.WritePdf(stampedPath)
	if err != nil {
		return err
	}

	doc.FilePath = stampedPath
	doc.Status = domain.StatusPendingDirector // เปลี่ยนสถานะเป็น รอ ผอ. สั่งการ
	return s.repo.Update(doc)
}

// KasienDocument กระบวนการ ผอ. ลงนามเกษียรหนังสือ
func (s *documentService) KasienDocument(docID uint, userID uint, req ports.RouteRequest) error {
	// 1. ดึงข้อมูลหนังสือและผู้ใช้งาน (ผอ.)
	doc, err := s.repo.FindByID(docID)
	if err != nil {
		return err
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}

	// 2. เริ่มต้นสร้าง PDF
	pdf := gopdf.GoPdf{}
	pdf.Start(gopdf.Config{PageSize: *gopdf.PageSizeA4})

	// Import หน้าล่าสุดของหนังสือ (ที่มีตราประทับธุรการอยู่แล้ว)
	tpl := pdf.ImportPage(doc.FilePath, 1, "/MediaBox")
	pdf.AddPage()
	pdf.UseImportedTemplate(tpl, 0, 0, 595, 842)

	// โหลดฟอนต์ภาษาไทย
	err = pdf.AddTTFFont("prompt", "./assets/fonts/Prompt-Regular.ttf")
	if err != nil {
		return fmt.Errorf("font error: %v", err)
	}

	// =========================================================
	// ตั้งค่าสีน้ำเงินสำหรับตราประทับ ผอ. (สีหมึกน้ำเงิน)
	// =========================================================
	pdf.SetStrokeColor(0, 0, 180)
	pdf.SetTextColor(0, 0, 180)
	pdf.SetLineWidth(1)

	// กำหนดพิกัดและขนาดกรอบตรายาง ผอ. (ขวาล่าง)
	boxX, boxY := 330.0, 580.0
	boxWidth := 245.0
	boxHeight := 220.0 // ขยายความสูงเผื่อข้อความยาว

	// วาดกรอบสี่เหลี่ยมตรายาง
	pdf.RectFromUpperLeftWithStyle(boxX, boxY, boxWidth, boxHeight, "D")

	// รายการตัวเลือกคำสั่งการ
	options := []string{
		"ทราบ",
		"อนุมัติ/อนุญาต",
		"เห็นชอบตามเสนอ",
		"มอบหมาย/สั่งการ",
	}

	currentY := boxY + 20.0
	pdf.SetFont("prompt", "", 11)

	for _, opt := range options {
		// วาดช่อง Checkbox
		pdf.RectFromUpperLeftWithStyle(boxX+15, currentY, 10, 10, "D")

		// ตรวจสอบสถานะการเลือก (ติ๊กถูก /)
		if strings.Contains(req.Action, opt) {
			pdf.SetXY(boxX+16, currentY-2)
			pdf.SetFont("prompt", "", 14)
			pdf.Cell(nil, "/") 
			pdf.SetFont("prompt", "", 11)
		}

		// เขียนข้อความ Option
		pdf.SetXY(boxX+35, currentY)
		pdf.Cell(nil, opt)

		if opt == "มอบหมาย/สั่งการ" {
			pdf.SetXY(boxX+110, currentY)
			pdf.Cell(nil, "....................................................")
		}
		currentY += 15.0
	}

	// =========================================================
	// ส่วนการจัดการข้อความสั่งการ (CommandNote) - รองรับการขึ้นบรรทัดใหม่
	// =========================================================
	padding := 20.0
	maxWidth := boxWidth - (padding * 2)
	pdf.SetFont("prompt", "", 10)
	
	if req.CommandNote != "" {
		// ตัดคำให้อยู่ในขอบเขตความกว้างของกรอบ
		lines, _ := pdf.SplitText(req.CommandNote, maxWidth)
		
		textY := currentY + 5.0
		for _, line := range lines {
			// ตรวจสอบไม่ให้พิมพ์ล้นกรอบลงไปทับชื่อ
			if textY > boxY+140 {
				break
			}
			pdf.SetXY(boxX+padding, textY)
			pdf.Cell(nil, line)
			
			// วาดเส้นจุดไข่ปลามารองรับข้อความ (Optional - เพื่อความสวยงาม)
			pdf.SetXY(boxX+padding, textY+2)
			pdf.Cell(nil, "..........................................................................................................")
			
			textY += 16.0 // ระยะบรรทัด
		}
	} else {
		// ถ้าไม่มีข้อความ ให้วาดเส้นว่างไว้ 2 บรรทัด
		pdf.SetXY(boxX+padding, currentY+5)
		pdf.Cell(nil, "..........................................................................................................")
		pdf.SetXY(boxX+padding, currentY+21)
		pdf.Cell(nil, "..........................................................................................................")
	}

	// =========================================================
	// ส่วนลายเซ็นและชื่อตำแหน่ง
	// =========================================================
	
	// แปะลายเซ็น ผอ. (Signature Data)
	if req.SignatureData != "" {
		rawImgData := strings.Split(req.SignatureData, ",")[1]
		dec, _ := base64.StdEncoding.DecodeString(rawImgData)
		imgH, err := gopdf.ImageHolderByBytes(dec)
		if err == nil {
			// วาดลายเซ็นให้อยู่ด้านบนของชื่อ
			pdf.ImageByHolder(imgH, boxX+80, boxY+135, &gopdf.Rect{W: 85, H: 45})
		}
	}

	// พิมพ์ชื่อ ผอ.
	pdf.SetFont("prompt", "", 11)
	nameText := fmt.Sprintf("( %s )", user.FullName)
	nameWidth, _ := pdf.MeasureTextWidth(nameText)
	pdf.SetXY(boxX+(boxWidth-nameWidth)/2, boxY+185)
	pdf.Cell(nil, nameText)

	// พิมพ์ตำแหน่ง
	pdf.SetFont("prompt", "", 9)
	titleText := "ผู้อำนวยการโรงเรียนเตรียมอุดมศึกษา ภาคเหนือ"
	titleWidth, _ := pdf.MeasureTextWidth(titleText)
	pdf.SetXY(boxX+(boxWidth-titleWidth)/2, boxY+202)
	pdf.Cell(nil, titleText)

	// 3. บันทึกไฟล์และอัปเดตข้อมูล
	finalPath := strings.Replace(doc.FilePath, "_stamped.pdf", "_final.pdf", 1)
	if finalPath == doc.FilePath {
		finalPath = strings.Replace(doc.FilePath, ".pdf", "_final.pdf", 1)
	}

	err = pdf.WritePdf(finalPath)
	if err != nil {
		return err
	}

	// อัปเดตข้อมูลเอกสาร
	doc.FilePath = finalPath
	s.repo.Update(doc)

	// บันทึกประวัติเส้นทาง
	route := domain.DocumentRoute{
		DocID:       docID,
		SenderID:    userID,
		ActionType:  domain.ActionType(req.Action),
		CommandNote: req.CommandNote,
		IsRead:      true,
	}
	s.repo.CreateRoute(&route)

	return s.repo.UpdateStatus(doc.ID, domain.StatusDirectorSigned)
}

// GetAllDocuments ดึงรายการหนังสือทั้งหมด
func (s *documentService) GetAllDocuments() ([]domain.Document, error) {
	return s.repo.FindAll()
}

// GetDocumentByID ดึงรายละเอียดหนังสือตาม ID
func (s *documentService) GetDocumentByID(id uint) (*domain.Document, error) {
	return s.repo.FindByID(id)
}

// GetDepartments ดึงรายชื่อฝ่ายทั้งหมด
func (s *documentService) GetDepartments() ([]domain.Department, error) {
	return s.repo.GetAllDepartments()
}

// DistributeDocument แจกจ่ายหนังสือไปยังฝ่ายต่างๆ พร้อมแจ้งเตือน Telegram
func (s *documentService) DistributeDocument(docID uint, adminID uint, deptIDs []uint) error {
	doc, err := s.repo.FindByID(docID)
	if err != nil {
		return err
	}

	targetDepts, _ := s.repo.GetDepartmentsByIDs(deptIDs)
	for _, dept := range targetDepts {
		route := domain.DocumentRoute{
			DocID:          docID,
			SenderID:       adminID,
			ReceiverDeptID: &dept.ID,
			ActionType:     "assigned",
			IsRead:         false,
		}
		s.repo.CreateRoute(&route)

		// แจ้งเตือนผ่าน Telegram หากมีการตั้งค่า Chat ID ไว้
		if s.notifier != nil && dept.TelegramChatID != "" {
			msg := fmt.Sprintf("📢 *มีหนังสือใหม่ถึงฝ่ายท่าน*\n\n📄 เรื่อง: %s\n🔖 เลขรับ: %s", doc.Subject, doc.ReceiveNo)
			s.notifier.SendMessage(dept.TelegramChatID, msg)
		}
	}
	return s.repo.UpdateStatus(docID, domain.StatusDistributed)
}


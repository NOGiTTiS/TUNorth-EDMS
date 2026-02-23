package services

import (
	"encoding/base64"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"github.com/google/uuid"
	"github.com/signintech/gopdf"
)

// สร้าง Service พร้อมเชื่อมต่อ Repository และ Notification
type documentService struct {
	repo        ports.DocumentRepository
	userRepo    ports.UserRepository
	settingRepo ports.SettingRepository
	notifier    ports.NotificationService
}

// สร้าง Service พร้อมเชื่อมต่อ Repository และ Notification
func NewDocumentService(repo ports.DocumentRepository, userRepo ports.UserRepository, settingRepo ports.SettingRepository, notifier ports.NotificationService) ports.DocumentService {
	return &documentService{
		repo:        repo,
		userRepo:    userRepo,
		settingRepo: settingRepo,
		notifier:    notifier,
	}
}

// ลงรับหนังสือเบื้องต้น (บันทึกไฟล์ต้นฉบับและข้อมูลลง DB)
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

// แก้ไขข้อมูลเอกสาร
func (s *documentService) UpdateDocumentInfo(id uint, req ports.UpdateDocRequest) error {
	doc, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	// แปลงวันที่จาก String กลับเป็น time.Time
	if req.ReceiveDate != "" {
		parsedDate, _ := time.Parse("2006-01-02", req.ReceiveDate)
		doc.ReceiveDate = parsedDate
	}
	if req.DocDate != "" {
		parsedDate, _ := time.Parse("2006-01-02", req.DocDate)
		doc.DocDate = parsedDate
	}

	// อัปเดตฟิลด์อื่นๆ
	if req.ReceiveNo != "" {
		doc.ReceiveNo = req.ReceiveNo
	}
	if req.DocNo != "" {
		doc.DocNo = req.DocNo
	}
	if req.From != "" {
		doc.From = req.From
	}
	if req.To != "" {
		doc.To = req.To
	}
	if req.Subject != "" {
		doc.Subject = req.Subject
	}

	// บันทึกลง Database
	return s.repo.Update(doc)
}

// ลบเอกสาร
func (s *documentService) DeleteDocument(id uint) error {
	return s.repo.Delete(id)
}

// กระบวนการประทับตรา 2 จุด และลงนามธุรการลงใน PDF
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

	err = s.repo.Update(doc)

	// ==========================================
	// 1. แจ้งเตือน Telegram -> ผอ. (รอ ผอ. สั่งการ)
	// ==========================================
	if s.canSendNotify() {
		directors, _ := s.userRepo.FindByRole(string(domain.RoleDirector))

		// 1. สร้าง URL ลิงก์ (ป้องกัน Error undefined)
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:3000"
		}
		docLink := fmt.Sprintf("%s/dashboard/documents/%d", frontendURL, doc.ID)

		// 2. วนลูปส่งหา ผอ. ทุกคนที่มี Chat ID
		for _, dir := range directors {
			if dir.TelegramChatID != "" {
				msg := fmt.Sprintf("⚠️ <b>หนังสือเข้าใหม่ (รอสั่งการ)</b> ⚠️\n\n📄 <b>เรื่อง:</b> %s\n🔖 <b>เลขรับ:</b> %s\n👤 <b>จาก:</b> %s\n📌 <b>สถานะ:</b> รอผู้อำนวยการสั่งการ\n\n🔗 <b>เปิดเอกสารได้ที่ลิงก์ด้านล่าง:</b>\n%s",
					doc.Subject, doc.ReceiveNo, doc.From, docLink)
				s.notifier.SendMessage(dir.TelegramChatID, msg)
			}
		}
	}

	return err
}

// กระบวนการ ผอ. ลงนามเกษียรหนังสือ
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
	err = s.repo.UpdateStatus(doc.ID, domain.StatusDirectorSigned)

	// ==========================================
	// 2. แจ้งเตือน Telegram -> ธุรการกลาง
	// ==========================================
	if s.canSendNotify() {
		admins, _ := s.userRepo.FindByRole(string(domain.RoleAdminCentral))

		// 1. สร้าง URL ลิงก์
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:3000"
		}
		docLink := fmt.Sprintf("%s/dashboard/documents/%d", frontendURL, doc.ID)

		// 2. วนลูปส่งหาแอดมินทุกคน
		for _, admin := range admins {
			if admin.TelegramChatID != "" {
				msg := fmt.Sprintf("✅ <b>ผู้อำนวยการสั่งการแล้ว</b> ✅\n\n📄 <b>เรื่อง:</b> %s\n🔖 <b>เลขรับ:</b> %s\n👤 <b>จาก:</b> %s\n📌 <b>สถานะ:</b> รอธุรการส่งต่อ\n\n🔗 <b>เปิดเอกสารได้ที่ลิงก์ด้านล่าง:</b>\n%s",
					doc.Subject, doc.ReceiveNo, doc.From, docLink)
				s.notifier.SendMessage(admin.TelegramChatID, msg)
			}
		}
	}

	return err
}

// ค้นหาเอกสาร
func (s *documentService) SearchDocuments(query ports.DocumentQuery) (*ports.PaginatedDocument, error) {
	return s.repo.SearchDocuments(query)
}

// ดึงรายละเอียดหนังสือตาม ID
func (s *documentService) GetDocumentByID(id uint) (*domain.Document, error) {
	return s.repo.FindByID(id)
}

// ดึงรายชื่อฝ่ายทั้งหมด
func (s *documentService) GetDepartments() ([]domain.Department, error) {
	return s.repo.GetAllDepartments()
}

// ส่งต่อหนังสือไปยังฝ่ายต่างๆ พร้อมแจ้งเตือน Telegram
func (s *documentService) DistributeDocument(docID uint, adminID uint, deptIDs []uint) error {
	// 1. ดึงข้อมูลหนังสือ
	doc, err := s.repo.FindByID(docID)
	if err != nil {
		return err
	}

	// 2. ดึงรายชื่อฝ่ายที่ถูกเลือก
	targetDepts, _ := s.repo.GetDepartmentsByIDs(deptIDs)

	// 3. เตรียมลิงก์สำหรับเปิดเอกสาร
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	docLink := fmt.Sprintf("%s/dashboard/documents/%d", frontendURL, doc.ID)

	for _, dept := range targetDepts {
		// 3.1 บันทึกประวัติการส่งต่อ (Route)
		route := domain.DocumentRoute{
			DocID:          docID,
			SenderID:       adminID,
			ReceiverDeptID: &dept.ID,
			ActionType:     "assigned",
			IsRead:         false,
		}
		s.repo.CreateRoute(&route)

		// 3.2 ส่งแจ้งเตือน Telegram
		if s.canSendNotify() {
			// ข้อความแจ้งเตือน (รูปแบบ HTML)
			msg := fmt.Sprintf("📢 <b>หนังสือเข้าใหม่ถึงฝ่ายท่าน (%s)</b> 📢\n\n📄 <b>เรื่อง:</b> %s\n🔖 <b>เลขรับ:</b> %s\n👤 <b>จาก:</b> %s\n📌 <b>สถานะ:</b> แจกจ่ายไปยังฝ่ายแล้ว\n\n🔗 <b>เปิดเอกสารได้ที่ลิงก์ด้านล่าง:</b>\n%s",
				dept.Name, doc.Subject, doc.ReceiveNo, doc.From, docLink)

			// กรณีที่ 1: ส่งเข้า Chat ID ของ "ฝ่าย" (เช่น กลุ่มไลน์/กลุ่ม Telegram ของฝ่าย)
			if dept.TelegramChatID != "" {
				s.notifier.SendMessage(dept.TelegramChatID, msg)
			}

			// กรณีที่ 2: ส่งหา "ธุรการฝ่าย (Admin Dept)" ทุกคนที่สังกัดฝ่ายนี้แบบรายบุคคล
			deptAdmins, _ := s.userRepo.FindByDeptAndRole(dept.ID, string(domain.RoleAdminDept))
			for _, admin := range deptAdmins {
				if admin.TelegramChatID != "" {
					s.notifier.SendMessage(admin.TelegramChatID, msg)
				}
			}
		}
	}

	// 4. อัปเดตสถานะหนังสือเป็น "แจกจ่ายแล้ว"
	return s.repo.UpdateStatus(docID, domain.StatusDistributed)
}

// ดึงเลขรับถัดไป
func (s *documentService) GetNextReceiveNumber() (string, error) {
	// 1. ดึงรูปแบบการรันเลขจาก Setting
	setting, err := s.settingRepo.GetByKey(domain.SetDocNumberFormat)
	format := "continuous" // default
	if err == nil {
		format = setting.Value
	}

	// 2. ดึงหนังสือเล่มล่าสุดจากระบบ (เพื่อดูเลขล่าสุด)
	// ต้องไปเพิ่ม FindLastDocument ใน Repo ก่อน (ดู Step 1.2)
	lastDoc, err := s.repo.FindLastDocument()

	// กรณีเพิ่งเริ่มระบบ ยังไม่มีหนังสือเลย
	if err != nil || lastDoc.ReceiveNo == "" {
		if format == "yearly" {
			return fmt.Sprintf("1/%d", time.Now().Year()+543), nil
		}
		return "1", nil
	}

	// 3. คำนวณเลขถัดไป
	if format == "yearly" {
		// รูปแบบ: X/2569
		currentThaiYear := time.Now().Year() + 543
		parts := strings.Split(lastDoc.ReceiveNo, "/")

		// ถ้ามีรูปแบบถูกต้องและปีตรงกัน
		if len(parts) == 2 {
			lastNum, _ := strconv.Atoi(parts[0])
			lastYear, _ := strconv.Atoi(parts[1])

			if lastYear == currentThaiYear {
				// ปีเดียวกัน -> รันต่อ
				return fmt.Sprintf("%d/%d", lastNum+1, currentThaiYear), nil
			}
		}
		// ถ้าปีไม่ตรง (ขึ้นปีใหม่) หรือ Format ผิด -> รีเซ็ตเป็น 1
		return fmt.Sprintf("1/%d", currentThaiYear), nil

	} else {
		// รูปแบบ: Continuous (เลขเพียวๆ)
		// พยายามแปลงเลขล่าสุดเป็น Int แล้ว +1
		// แต่ถ้าเจอเลขแปลกๆ (เช่น A-001) จะพยายามดึงเฉพาะตัวเลขหรือเริ่มใหม่
		lastNum, err := strconv.Atoi(lastDoc.ReceiveNo)
		if err != nil {
			// กรณีแปลงไม่ได้ ให้เริ่ม 1 ใหม่ (หรืออาจจะต้องใช้ Regex ดึงตัวเลขถ้าซับซ้อนกว่านี้)
			return "1", nil
		}
		return strconv.Itoa(lastNum + 1), nil
	}
}

// สร้างฝ่าย
func (s *documentService) CreateDepartment(req domain.Department) error {
	return s.repo.CreateDepartment(&req)
}

// แก้ไขฝ่าย
func (s *documentService) UpdateDepartment(id uint, req domain.Department) error {
	dept, err := s.repo.GetDepartmentsByIDs([]uint{id})
	if err != nil || len(dept) == 0 {
		return fmt.Errorf("not found")
	}

	req.ID = id // บังคับ ID เดิม
	return s.repo.UpdateDepartment(&req)
}

// ลบฝ่าย
func (s *documentService) DeleteDepartment(id uint) error {
	return s.repo.DeleteDepartment(id)
}

// ฟังก์ชันช่วยเช็คว่าเปิดแจ้งเตือนอยู่ไหม
func (s *documentService) canSendNotify() bool {
	if s.notifier == nil {
		return false
	}
	// เช็ค Global Setting จากหน้า Admin
	setting, err := s.settingRepo.GetByKey(domain.SetNotifyEnabled)
	if err == nil && setting.Value == "off" {
		return false // ถ้าตั้งค่าเป็น off ให้ข้ามการส่งไปเลย
	}
	return true
}

// ธุรการฝ่าย -> เสนอ รอง ผอ.
func (s *documentService) ForwardToDeputy(docID uint, senderID uint, note string) error {
	// 1. ดึงข้อมูลผู้ส่ง (ธุรการฝ่าย) เพื่อหาว่าอยู่ฝ่ายไหน
	sender, err := s.userRepo.FindByID(senderID)
	if err != nil { return err }
	if sender.DepartmentID == nil { return fmt.Errorf("user has no department") }

	// 2. หารอง ผอ. ประจำฝ่ายนั้น
	deputies, err := s.userRepo.FindByDeptAndRole(*sender.DepartmentID, string(domain.RoleDeputy))
	if err != nil || len(deputies) == 0 { return fmt.Errorf("deputy not found for this department") }
	deputy := deputies[0] // สมมติ 1 ฝ่ายมีรองฯ 1 คน

	// 3. สร้าง Route
	route := domain.DocumentRoute{
		DocID: docID, SenderID: senderID, ReceiverID: &deputy.ID,
		ActionType: "proposed", CommandNote: note, IsRead: false,
	}
	s.repo.CreateRoute(&route)

	// 4. แจ้งเตือน Telegram -> รองฯ
	if s.canSendNotify() && deputy.TelegramChatID != "" {
		frontendURL := os.Getenv("FRONTEND_URL")
		docLink := fmt.Sprintf("%s/dashboard/documents/%d", frontendURL, docID)
		msg := fmt.Sprintf("⚠️ <b>หนังสือรอพิจารณา (ฝ่าย)</b>\n\nโปรดเข้าสู่ระบบเพื่อสั่งการ\n🔗 <b>เปิดเอกสาร:</b>\n%s", docLink)
		s.notifier.SendMessage(deputy.TelegramChatID, msg)
	}

	return s.repo.UpdateStatus(docID, domain.StatusPendingDeputy)
}

// รอง ผอ. -> เกษียร (Stamp หน้าใหม่)
func (s *documentService) DeputySign(docID uint, userID uint, req ports.RouteRequest) error {
	doc, err := s.repo.FindByID(docID)
	if err != nil { return err }
	user, err := s.userRepo.FindByID(userID)
	if err != nil { return err }

	pdf := gopdf.GoPdf{}
	pdf.Start(gopdf.Config{PageSize: *gopdf.PageSizeA4})
	
	// 1. Import หน้าแรกมาวางก่อน
	tpl1 := pdf.ImportPage(doc.FilePath, 1, "/MediaBox")
	pdf.AddPage()
	pdf.UseImportedTemplate(tpl1, 0, 0, 595, 842)

	// 2. เพิ่มหน้า 2 สำหรับการเกษียรของระดับฝ่าย
	pdf.AddPage() 
	_ = pdf.AddTTFFont("prompt", "./assets/fonts/Prompt-Regular.ttf")
	pdf.SetFont("prompt", "", 12)
	pdf.SetStrokeColor(0, 0, 180)
	pdf.SetTextColor(0, 0, 180)

	pdf.SetXY(50, 40)
	pdf.Cell(nil, "บันทึกการพิจารณา/สั่งการระดับฝ่าย")
	pdf.SetXY(50, 60)
	pdf.SetFont("prompt", "", 10)
	pdf.Cell(nil, "หน่วยงาน: "+user.Department.Name)

	// --- วาดตรายาง รองฯ (ตำแหน่งบนซ้ายของหน้า 2) ---
	boxX, boxY := 50.0, 90.0
	pdf.RectFromUpperLeftWithStyle(boxX, boxY, 250, 240, "D")
	
	options := []string{"ทราบ", "อนุมัติ/อนุญาต", "เห็นชอบตามเสนอ", "มอบหมาย/สั่งการ"}
	currY := boxY + 20.0
	for _, opt := range options {
		pdf.RectFromUpperLeftWithStyle(boxX+15, currY, 10, 10, "D")
		if strings.Contains(req.Action, opt) {
			pdf.SetXY(boxX+16, currY-2); pdf.SetFont("prompt", "", 14)
			pdf.Cell(nil, "/"); pdf.SetFont("prompt", "", 11)
		}
		pdf.SetXY(boxX+35, currY+8); pdf.Cell(nil, opt)
		currY += 25.0
	}

	// บันทึกข้อความ (Word Wrap)
	if req.CommandNote != "" {
		lines, _ := pdf.SplitText(req.CommandNote, 210)
		textY := currY + 5.0
		for _, line := range lines {
			pdf.SetXY(boxX+20, textY); pdf.Cell(nil, line)
			pdf.SetXY(boxX+20, textY+2); pdf.Cell(nil, ".............................................................")
			textY += 18.0
		}
	}

	// ลายเซ็น รองฯ
	if req.SignatureData != "" {
		raw := strings.Split(req.SignatureData, ",")[1]
		dec, _ := base64.StdEncoding.DecodeString(raw)
		imgH, _ := gopdf.ImageHolderByBytes(dec)
		pdf.ImageByHolder(imgH, boxX+80, boxY+145, &gopdf.Rect{W: 80, H: 40})
	}

	pdf.SetXY(boxX+60, boxY+200)
	pdf.Cell(nil, fmt.Sprintf("( %s )", user.FullName))
	pdf.SetXY(boxX+55, boxY+215)
	pdf.SetFont("prompt", "", 9)
	pdf.Cell(nil, "รองผู้อำนวยการโรงเรียนเตรียมอุดมศึกษา ภาคเหนือ")

	// บันทึกไฟล์ใหม่
	finalPath := strings.Replace(doc.FilePath, ".pdf", "_deputy.pdf", 1)
	pdf.WritePdf(finalPath)

	doc.FilePath = finalPath
	s.repo.Update(doc)

	// สร้าง Route และแจ้งเตือน
	s.repo.CreateRoute(&domain.DocumentRoute{
		DocID: docID, SenderID: userID, ActionType: domain.ActionType(req.Action), CommandNote: req.CommandNote, IsRead: true,
	})

	if s.canSendNotify() {
		admins, _ := s.userRepo.FindByDeptAndRole(*user.DepartmentID, string(domain.RoleAdminDept))
		for _, admin := range admins {
			if admin.TelegramChatID != "" {
				s.notifier.SendMessage(admin.TelegramChatID, "✅ <b>รองฯ ฝ่ายสั่งการแล้ว</b>\n📄 เรื่อง: "+doc.Subject)
			}
		}
	}
	return s.repo.UpdateStatus(doc.ID, domain.StatusDeputySigned)
}

// ธุรการฝ่าย -> ส่งหัวหน้างาน
func (s *documentService) ForwardToHead(docID uint, senderID uint, headIDs []uint) error {
	// 1. ดึงข้อมูลหนังสือเพื่อใช้ในการแจ้งเตือน
	doc, err := s.repo.FindByID(docID)
	if err != nil {
		return err
	}

	// เตรียม Link สำหรับ Telegram
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	docLink := fmt.Sprintf("%s/dashboard/documents/%d", frontendURL, docID)

	// 2. วนลูปส่งให้หัวหน้างานแต่ละคน
	for _, headID := range headIDs {
		// 2.1 สร้างประวัติการส่ง (Route)
		// ใช้ตัวแปร tempHeadID เพื่อเลี่ยงปัญหา pointer ใน loop
		tempHeadID := headID 
		
		route := domain.DocumentRoute{
			DocID:      docID,
			SenderID:   senderID,
			ReceiverID: &tempHeadID, // ระบุคนรับเป็นรายบุคคล
			ActionType: "assigned",  // สถานะ: มอบหมาย
			IsRead:     false,
		}
		s.repo.CreateRoute(&route)

		// 2.2 แจ้งเตือน Telegram ไปยังหัวหน้างาน
		if s.canSendNotify() {
			// ต้องดึงข้อมูล User หัวหน้างานก่อน เพื่อเอา Chat ID
			headUser, err := s.userRepo.FindByID(headID)
			if err == nil && headUser.TelegramChatID != "" {
				msg := fmt.Sprintf("📢 <b>งานเข้าใหม่ (จากธุรการฝ่าย)</b> 📢\n\n📄 <b>เรื่อง:</b> %s\n🔖 <b>เลขรับ:</b> %s\n📌 <b>สถานะ:</b> มอบหมายให้หัวหน้างาน\n\n🔗 <b>เปิดเอกสารได้ที่ลิงก์ด้านล่าง:</b>\n%s",
					doc.Subject, doc.ReceiveNo, docLink)
				s.notifier.SendMessage(headUser.TelegramChatID, msg)
			}
		}
	}

	// 3. อัปเดตสถานะเอกสารเป็น "ส่งหัวหน้างานแล้ว"
	return s.repo.UpdateStatus(docID, domain.StatusSentToHead)
}

// หัวหน้างานรับทราบและจบกระบวนการ
func (s *documentService) CompleteDocument(docID uint, userID uint) error {
	// (ในอนาคตอาจจะมีการบันทึก Route ว่าใครเป็นคนกดรับทราบ)
	return s.repo.UpdateStatus(docID, domain.StatusCompleted)
}
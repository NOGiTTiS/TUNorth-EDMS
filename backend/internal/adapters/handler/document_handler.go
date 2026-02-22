package handler

import (
	"fmt"
	"strings"
	"time"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type DocumentHandler struct {
	service ports.DocumentService
}

type StampRequest struct {
	DeptIDs        []uint `json:"dept_ids"`
	SignatureData  string `json:"signature_data"`
	NoteToDirector string `json:"note_to_director"` // เพิ่มตัวรับค่านี้
}

func NewDocumentHandler(service ports.DocumentService) *DocumentHandler {
	return &DocumentHandler{service: service}
}

func (h *DocumentHandler) RegisterDocument(c *fiber.Ctx) error {
	// 1. รับไฟล์ PDF
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาอัปโหลดไฟล์ PDF"})
	}

	// 2. รับข้อมูล Form Data
	receiveDate, _ := time.Parse("2006-01-02", c.FormValue("receive_date"))
	docDate, _ := time.Parse("2006-01-02", c.FormValue("doc_date"))

	doc := domain.Document{
		ReceiveNo:     c.FormValue("receive_no"),
		ReceiveDate:   receiveDate,
		DocNo:         c.FormValue("doc_no"),
		DocDate:       docDate,
		From:          c.FormValue("from"),
		To:            c.FormValue("to"),
		Subject:       c.FormValue("subject"),
		PhysicalStore: "ธุรการกลาง",
		CreatedByID:   1, // Mock Admin ID
	}

	// 3. เรียก Service
	if err := h.service.RegisterDocument(&doc, file); err != nil {
		// --- ดักจับ Error เลขซ้ำตรงนี้ ---
		if strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "duplicate key") {
			return c.Status(409).JSON(fiber.Map{
				"error": fmt.Sprintf("เลขทะเบียนรับ '%s' มีอยู่ในระบบแล้ว", doc.ReceiveNo),
			})
		}
		// -----------------------------
		
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// 4. Save File (Service กำหนด Path ไว้แล้ว)
	if err := c.SaveFile(file, doc.FilePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "บันทึกไฟล์ไม่สำเร็จ: " + err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "ลงรับหนังสือสำเร็จ",
		"data":    doc,
	})
}

// PUT /documents/:id
func (h *DocumentHandler) UpdateDocument(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	
	var req ports.UpdateDocRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := h.service.UpdateDocumentInfo(uint(id), req); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "อัปเดตข้อมูลสำเร็จ"})
}

// DELETE /documents/:id
func (h *DocumentHandler) DeleteDocument(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	
	if err := h.service.DeleteDocument(uint(id)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "ลบหนังสือสำเร็จ"})
}

func (h *DocumentHandler) GetDocuments(c *fiber.Ctx) error {
	docs, err := h.service.GetAllDocuments()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data": docs,
	})
}

// GET /documents/:id
func (h *DocumentHandler) GetDocument(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	doc, err := h.service.GetDocumentByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ไม่พบหนังสือ"})
	}
	return c.JSON(fiber.Map{"data": doc})
}

// POST /documents/:id/route
func (h *DocumentHandler) RouteDocument(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	
	// ดึง User ID จาก Token (ใน Middleware ที่จะทำ หรือ Mock ไปก่อน)
	// *เพื่อความรวดเร็วในการ Dev ตอนนี้ ให้ Hardcode ไปก่อนว่า User คือ ID 2 (Director)* 
	// (จริงๆ ต้องดึงจาก c.Locals("user").(*jwt.Token)...)
	userID := uint(2) 

	var req ports.RouteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := h.service.KasienDocument(uint(id), userID, req); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "บันทึกการสั่งการเรียบร้อยแล้ว"})
}

// GET /departments
func (h *DocumentHandler) GetDepartments(c *fiber.Ctx) error {
	depts, err := h.service.GetDepartments()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": depts})
}

// POST /documents/:id/distribute
func (h *DocumentHandler) Distribute(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	// Mock User Admin (ID 1)
	userID := uint(1)

	type DistributeReq struct {
		DeptIDs []uint `json:"dept_ids"`
	}
	var req DistributeReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid Request"})
	}

	if err := h.service.DistributeDocument(uint(id), userID, req.DeptIDs); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "แจกจ่ายหนังสือสำเร็จ"})
}

func (h *DocumentHandler) StampDocument(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	userID := uint(1) // Mock Admin ID

	var req StampRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	// อัปเดตการเรียกใช้: ส่ง req.NoteToDirector เข้าไปเป็น argument ที่ 5
	err := h.service.StampAndSign(uint(id), userID, req.DeptIDs, req.SignatureData, req.NoteToDirector)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "ประทับตราและส่งเสนอเรียบร้อย"})
}

func (h *DocumentHandler) GetNextNumber(c *fiber.Ctx) error {
	nextNo, err := h.service.GetNextReceiveNumber()
	if err != nil {
		// กรณี Error ให้ Default เป็นว่างๆ ไป User กรอกเอง
		return c.JSON(fiber.Map{"next_no": ""})
	}
	return c.JSON(fiber.Map{"next_no": nextNo})
}

func (h *DocumentHandler) CreateDepartment(c *fiber.Ctx) error {
	var req domain.Department
	if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error": "Invalid input"}) }
	if err := h.service.CreateDepartment(req); err != nil { return c.Status(500).JSON(fiber.Map{"error": err.Error()}) }
	return c.JSON(fiber.Map{"message": "เพิ่มฝ่ายสำเร็จ"})
}

func (h *DocumentHandler) UpdateDepartment(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	var req domain.Department
	if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error": "Invalid input"}) }
	if err := h.service.UpdateDepartment(uint(id), req); err != nil { return c.Status(500).JSON(fiber.Map{"error": err.Error()}) }
	return c.JSON(fiber.Map{"message": "อัปเดตฝ่ายสำเร็จ"})
}

func (h *DocumentHandler) DeleteDepartment(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	if err := h.service.DeleteDepartment(uint(id)); err != nil { return c.Status(500).JSON(fiber.Map{"error": err.Error()}) }
	return c.JSON(fiber.Map{"message": "ลบฝ่ายสำเร็จ"})
}
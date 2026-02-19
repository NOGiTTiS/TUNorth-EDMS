package handler

import (
	"time"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type DocumentHandler struct {
	service ports.DocumentService
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
	// หมายเหตุ: การใช้ c.FormValue รับค่าจะเป็น String ต้องแปลงเป็น Time หรือ Int ตามต้องการ
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
		PhysicalStore: "ธุรการกลาง", // Default
		// CreatedByID:  ดึงจาก JWT Token (Middleware) - เดี๋ยวทำ Part หน้า
		CreatedByID: 1, // Mock ไว้ก่อนว่าเป็น Admin (ID 1)
	}

	// 3. เรียก Service
	if err := h.service.RegisterDocument(&doc, file); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// 4. Save File จริงๆ (Fiber Helper)
	// Service กำหนด Path ไว้ใน doc.FilePath แล้ว
	if err := c.SaveFile(file, doc.FilePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "บันทึกไฟล์ไม่สำเร็จ: " + err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "ลงรับหนังสือสำเร็จ",
		"data":    doc,
	})
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
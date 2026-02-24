package handler

import (
	"fmt"
	"strconv"
	"strings"
	"time"
	"github.com/golang-jwt/jwt/v5"
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
	userID := getUserID(c) // ดึง ID จาก Token

	search := c.Query("search", "")
	year, _ := strconv.Atoi(c.Query("year", "0"))
	month, _ := strconv.Atoi(c.Query("month", "0"))
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "15"))

	query := ports.DocumentQuery{
		Search: search,
		Year:   year,
		Month:  month,
		Page:   page,
		Limit:  limit,
	}

	// ส่ง userID เข้าไป
	result, err := h.service.SearchDocuments(userID, query)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(result)
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
	userID := getUserID(c) 

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

func (h *DocumentHandler) Distribute(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	// Mock User Admin (ID 1)
	userID := getUserID(c)

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

	return c.JSON(fiber.Map{"message": "ส่งต่อหนังสือสำเร็จ"})
}

func (h *DocumentHandler) StampDocument(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	userID := getUserID(c) // Mock Admin ID

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

func (h *DocumentHandler) ForwardToHead(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	
	// Mock User ID ของคนส่ง (ในระบบจริงดึงจาก Token JWT)
	// สมมติว่าเป็น User ID 3 (ธุรการฝ่าย)
	senderID := getUserID(c)

	// Struct รับข้อมูล JSON: { "head_ids": [5, 6] }
	type ForwardReq struct {
		HeadIDs []uint `json:"head_ids"`
	}
	
	var req ForwardReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	if len(req.HeadIDs) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาเลือกหัวหน้างานอย่างน้อย 1 คน"})
	}

	// เรียก Service
	if err := h.service.ForwardToHead(uint(id), senderID, req.HeadIDs); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "ส่งต่อหัวหน้างานสำเร็จ"})
}

func (h *DocumentHandler) ForwardToDeputy(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	senderID := getUserID(c) // Mock ID ของธุรการฝ่าย (ในระบบจริงต้องดึงจาก Token)

	type ForwardReq struct {
		Note string `json:"note"`
	}
	var req ForwardReq
	c.BodyParser(&req) // อนุญาตให้ Note ว่างได้

	if err := h.service.ForwardToDeputy(uint(id), senderID, req.Note); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "ส่งเสนอรองผู้อำนวยการสำเร็จ"})
}

func (h *DocumentHandler) DeputySign(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	userID := getUserID(c) // Mock ID ของรองผู้อำนวยการ

	var req ports.RouteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := h.service.DeputySign(uint(id), userID, req); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "รองผู้อำนวยการลงนามสั่งการสำเร็จ"})
}

func (h *DocumentHandler) CompleteDocument(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	userID := uint(5) // Mock ID หัวหน้างาน

	if err := h.service.CompleteDocument(uint(id), userID); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "ดำเนินการเสร็จสิ้น"})
}

// ฟังก์ชันช่วยดึง User ID จาก Token ที่ส่งมาใน Header
func getUserID(c *fiber.Ctx) uint {
	authHeader := c.Get("Authorization")
	if authHeader == "" { return 0 }

	tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
	
    // ใช้ Secret Key เดียวกับที่ตั้งไว้ใน auth_service.go
	token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte("my_super_secret_key_tunorth_edms"), nil
	})

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if id, ok := claims["user_id"].(float64); ok {
			return uint(id)
		}
	}
	return 0
}

func (h *DocumentHandler) GetStats(c *fiber.Ctx) error {
	userID := getUserID(c)
	stats, err := h.service.GetDashboardStats(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": stats})
}
package handler

import (
	"strconv"
	"strings"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	service ports.UserService
}

func NewUserHandler(service ports.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) GetUsers(c *fiber.Ctx) error {
	role := c.Query("role", "")
	deptID, _ := strconv.Atoi(c.Query("department_id", "0"))

	users, err := h.service.GetAllUsers(role, uint(deptID))
	if err != nil { 
		return c.Status(500).JSON(fiber.Map{"error": err.Error()}) 
	}
	return c.JSON(fiber.Map{"data": users})
}

// --- สร้าง Struct พิเศษสำหรับรับข้อมูลจากหน้าเว็บ ---
type UserPayload struct {
	Username       string `json:"username"`
	Password       string `json:"password"` // รับ Password ได้
	FullName       string `json:"full_name"`
	Role           string `json:"role"`
	Position       string `json:"position"`
	DepartmentID   *uint  `json:"department_id"`
	TelegramChatID string `json:"telegram_chat_id"`
}

func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var req UserPayload
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid data"})
	}

	// แมปข้อมูลจาก Payload ไปยัง Domain User
	user := domain.User{
		Username:       req.Username,
		Password:       req.Password, // นำรหัสที่พิมพ์มาใส่ตรงนี้
		FullName:       req.FullName,
		Role:           domain.UserRole(req.Role),
		Position:       req.Position,
		DepartmentID:   req.DepartmentID,
		TelegramChatID: req.TelegramChatID,
	}

	if err := h.service.CreateUser(&user); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "สร้างผู้ใช้สำเร็จ"})
}

func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	var req UserPayload
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid data"})
	}

	user := domain.User{
		Username:       req.Username,
		Password:       req.Password, // ถ้าว่าง Service จะไม่เปลี่ยนรหัสให้
		FullName:       req.FullName,
		Role:           domain.UserRole(req.Role),
		Position:       req.Position,
		DepartmentID:   req.DepartmentID,
		TelegramChatID: req.TelegramChatID,
	}

	if err := h.service.UpdateUser(uint(id), &user); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "อัปเดตผู้ใช้สำเร็จ"})
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	if err := h.service.DeleteUser(uint(id)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "ลบผู้ใช้สำเร็จ"})
}

func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	type ProfileReq struct {
		FullName string `json:"full_name"`
		Password string `json:"password"`
	}
	var req ProfileReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid data"})
	}

	if err := h.service.UpdateProfile(uint(id), req.FullName, req.Password); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "อัปเดตโปรไฟล์สำเร็จ"})
}

func (h *UserHandler) RegisterUser(c *fiber.Ctx) error {
	var req UserPayload
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// บังคับค่าเริ่มต้นเพื่อความปลอดภัย (คนที่สมัครเองจะเป็นธุรการฝ่ายโดย Default)
	// Admin ค่อยไปเปลี่ยน Role ทีหลังได้
	user := domain.User{
		Username: req.Username,
		Password: req.Password,
		FullName: req.FullName,
		Role:     domain.RoleAdminDept, // Default Role
	}

	if err := h.service.CreateUser(&user); err != nil {
		// เช็ค Username ซ้ำ
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			return c.Status(409).JSON(fiber.Map{"error": "ชื่อผู้ใช้งานนี้มีในระบบแล้ว"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "สมัครสมาชิกไม่สำเร็จ: " + err.Error()})
	}

	return c.JSON(fiber.Map{"message": "สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ"})
}
package handler

import (
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
	users, err := h.service.GetAllUsers()
	if err != nil { return c.Status(500).JSON(fiber.Map{"error": err.Error()}) }
	return c.JSON(fiber.Map{"data": users})
}

func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var user domain.User
	if err := c.BodyParser(&user); err != nil { return c.Status(400).JSON(fiber.Map{"error": "Invalid data"}) }
	if err := h.service.CreateUser(&user); err != nil { return c.Status(500).JSON(fiber.Map{"error": err.Error()}) }
	return c.JSON(fiber.Map{"message": "สร้างผู้ใช้สำเร็จ"})
}

func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	var user domain.User
	if err := c.BodyParser(&user); err != nil { return c.Status(400).JSON(fiber.Map{"error": "Invalid data"}) }
	if err := h.service.UpdateUser(uint(id), &user); err != nil { return c.Status(500).JSON(fiber.Map{"error": err.Error()}) }
	return c.JSON(fiber.Map{"message": "อัปเดตผู้ใช้สำเร็จ"})
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id")
	if err := h.service.DeleteUser(uint(id)); err != nil { return c.Status(500).JSON(fiber.Map{"error": err.Error()}) }
	return c.JSON(fiber.Map{"message": "ลบผู้ใช้สำเร็จ"})
}

// สำหรับให้ User แก้ไขโปรไฟล์ตัวเอง
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	id, _ := c.ParamsInt("id") // ในระบบจริงควรดึงจาก Token JWT
	type ProfileReq struct {
		FullName string `json:"full_name"`
		Password string `json:"password"`
	}
	var req ProfileReq
	if err := c.BodyParser(&req); err != nil { return c.Status(400).JSON(fiber.Map{"error": "Invalid data"}) }
	
	if err := h.service.UpdateProfile(uint(id), req.FullName, req.Password); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "อัปเดตโปรไฟล์สำเร็จ"})
}
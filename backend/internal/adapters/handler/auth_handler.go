package handler

import (
	"tunorth-edms-backend/internal/core/ports"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService ports.AuthService
}

func NewAuthHandler(authService ports.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// LoginRequest Struct สำหรับรับ JSON Body
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	token, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"message": "Login successful",
	})
}
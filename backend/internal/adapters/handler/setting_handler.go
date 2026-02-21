package handler

import (
	"fmt"
	"os"
	"path/filepath"
	"github.com/google/uuid"
	"tunorth-edms-backend/internal/core/ports"
	"github.com/gofiber/fiber/v2"
)

type SettingHandler struct {
	service ports.SettingService
}

func NewSettingHandler(service ports.SettingService) *SettingHandler {
	return &SettingHandler{service: service}
}

func (h *SettingHandler) GetSettings(c *fiber.Ctx) error {
	settings, err := h.service.GetAllSettings()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"data": settings})
}

func (h *SettingHandler) UpdateSettings(c *fiber.Ctx) error {
	var payload map[string]string
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid payload"})
	}

	if err := h.service.UpdateSettings(payload); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "บันทึกการตั้งค่าสำเร็จ"})
}

// POST /settings/upload
func (h *SettingHandler) UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาอัปโหลดไฟล์"})
	}

	uploadDir := "./uploads/settings"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	ext := filepath.Ext(file.Filename)
	newFileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	filePath := filepath.Join(uploadDir, newFileName)

	if err := c.SaveFile(file, filePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "บันทึกไฟล์ไม่สำเร็จ"})
	}

	// ----------------------------------------------------
	// แก้ไขการสร้าง Path ให้รองรับ Windows และ Linux
	// เปลี่ยนจากการใช้ filePath[2:] เป็นการต่อ String ตรงๆ
	// ----------------------------------------------------
	webPath := fmt.Sprintf("/uploads/settings/%s", newFileName)

	return c.JSON(fiber.Map{
		"url": webPath, 
	})
}
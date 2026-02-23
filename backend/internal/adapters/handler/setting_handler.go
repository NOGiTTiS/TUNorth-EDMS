package handler

import (
	"fmt"
	"os"
	"path/filepath"
	"github.com/google/uuid"
	"tunorth-edms-backend/internal/core/ports"
	"github.com/gofiber/fiber/v2"
	"encoding/json"
    "net/http"
    "tunorth-edms-backend/internal/core/domain"
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

// GET /telegram/latest-id (Public)
func (h *SettingHandler) GetLatestTelegramChatID(c *fiber.Ctx) error {
    // 1. ดึง Token จาก Database
    settings, err := h.service.GetAllSettings()
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Internal Server Error"})
    }
    
    token := settings[domain.SetTelegramToken]
    if token == "" {
        return c.Status(400).JSON(fiber.Map{"error": "ระบบยังไม่ได้ตั้งค่า Telegram Token"})
    }

    // 2. เรียก API Telegram getUpdates เพื่อดูข้อความล่าสุด
    resp, err := http.Get(fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?limit=1&offset=-1", token))
    if err != nil {
        return c.Status(502).JSON(fiber.Map{"error": "ไม่สามารถติดต่อ Telegram Server ได้"})
    }
    defer resp.Body.Close()

    // 3. แกะ JSON Response
    var result struct {
        Ok     bool `json:"ok"`
        Result []struct {
            Message struct {
                Chat struct {
                    ID int64 `json:"id"`
                } `json:"chat"`
            } `json:"message"`
        } `json:"result"`
    }

    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Parse Error"})
    }

    if !result.Ok || len(result.Result) == 0 {
        return c.Status(404).JSON(fiber.Map{"error": "ไม่พบข้อความล่าสุด (กรุณากด Start ที่บอทก่อน)"})
    }

    // 4. ส่ง ID กลับไป
    return c.JSON(fiber.Map{
        "chat_id": result.Result[0].Message.Chat.ID,
    })
}
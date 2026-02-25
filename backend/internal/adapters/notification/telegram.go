package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"             // เพิ่ม
	"mime/multipart" // เพิ่ม
	"net/http"
	"os"             // เพิ่ม
	"path/filepath"  // เพิ่ม
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"
)

type telegramService struct {
	settingRepo ports.SettingRepository // ดึงค่าจาก DB
}

// รับ settingRepo เข้ามาตอนสร้าง
func NewTelegramService(settingRepo ports.SettingRepository) ports.NotificationService {
	return &telegramService{
		settingRepo: settingRepo,
	}
}

func (s *telegramService) SendMessage(chatID string, text string) error {
	// 1. ดึง Token จากหน้าตั้งค่า (Database)
	setting, err := s.settingRepo.GetByKey(domain.SetTelegramToken)
	
	// ถ้าไม่มี Token ในระบบ หรือลืมใส่ Chat ID ให้ข้ามไป (ไม่แจ้งเตือน ไม่ต้อง Error)
	if err != nil || setting.Value == "" || chatID == "" {
		fmt.Println("Telegram Skipped: Missing Token or Chat ID")
		return nil 
	}

	botToken := setting.Value
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)
	body, _ := json.Marshal(map[string]string{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "HTML",
	})

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		fmt.Println("Telegram Error:", err.Error())
		return err
	}
	defer resp.Body.Close()

	fmt.Println("Telegram Sent to:", chatID)
	return nil
}

// อัปเดตฟังก์ชันให้รับ displayFilename
func (s *telegramService) SendDocument(chatID string, caption string, filePath string, displayFilename string) error {
	setting, err := s.settingRepo.GetByKey(domain.SetTelegramToken)
	if err != nil || setting.Value == "" || chatID == "" {
		return nil
	}
	botToken := setting.Value

	file, err := os.Open(filePath)
	if err != nil {
		fmt.Println("Telegram File Error:", err)
		return s.SendMessage(chatID, caption)
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	writer.WriteField("chat_id", chatID)
	writer.WriteField("caption", caption)
	writer.WriteField("parse_mode", "HTML")

	// --- ใช้ชื่อไฟล์ที่ตั้งมาใหม่ แทนชื่อไฟล์ UUID ในระบบ ---
	if displayFilename == "" {
		displayFilename = filepath.Base(filePath) // ถ้าไม่ส่งชื่อมา ให้ใช้ชื่อเดิม
	}
	part, err := writer.CreateFormFile("document", displayFilename)
	// --------------------------------------------------
	
	if err != nil {
		return err
	}
	io.Copy(part, file)
	writer.Close()

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendDocument", botToken)
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Telegram Upload Error:", err.Error())
		return err
	}
	defer resp.Body.Close()

	fmt.Println("Telegram Document Sent to:", chatID)
	return nil
}
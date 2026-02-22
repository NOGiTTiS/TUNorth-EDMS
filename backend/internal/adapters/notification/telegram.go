package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
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
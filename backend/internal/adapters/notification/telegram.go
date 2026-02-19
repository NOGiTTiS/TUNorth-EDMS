package notification

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"tunorth-edms-backend/internal/core/ports"
)

type telegramService struct {
	BotToken string
}

func NewTelegramService() ports.NotificationService {
	return &telegramService{
		BotToken: os.Getenv("TELEGRAM_BOT_TOKEN"),
	}
}

func (s *telegramService) SendMessage(chatID string, text string) error {
	if s.BotToken == "" || chatID == "" {
		return nil // ถ้าไม่ได้ตั้งค่า ก็ข้ามไป ไม่ต้อง Error
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.BotToken)
	body, _ := json.Marshal(map[string]string{
		"chat_id": chatID,
		"text":    text,
		"parse_mode": "Markdown",
	})

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}
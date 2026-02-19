package ports

type NotificationService interface {
	SendMessage(chatID string, message string) error
}
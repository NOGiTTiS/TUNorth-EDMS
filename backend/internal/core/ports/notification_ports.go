package ports

type NotificationService interface {
	SendMessage(chatID string, message string) error
	SendDocument(chatID string, caption string, filePath string, displayFilename string) error
}
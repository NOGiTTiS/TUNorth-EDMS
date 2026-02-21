package ports

import "tunorth-edms-backend/internal/core/domain"

type SettingRepository interface {
	GetAll() ([]domain.SystemSetting, error)
	GetByKey(key string) (*domain.SystemSetting, error)
	Upsert(setting *domain.SystemSetting) error // Insert หรือ Update
}

type SettingService interface {
	GetAllSettings() (map[string]string, error) // แปลงเป็น map เพื่อง่ายต่อ Frontend
	UpdateSettings(settings map[string]string) error
}
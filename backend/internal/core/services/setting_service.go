package services

import (
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"
)

type settingService struct {
	repo ports.SettingRepository
}

func NewSettingService(repo ports.SettingRepository) ports.SettingService {
	return &settingService{repo: repo}
}

// ส่งออกเป็น Map { "system_name": "TUNorth", ... } เพื่อให้ Frontend ใช้ง่าย
func (s *settingService) GetAllSettings() (map[string]string, error) {
	settingsList, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	settingsMap := make(map[string]string)
	for _, setting := range settingsList {
		settingsMap[setting.Key] = setting.Value
	}
	return settingsMap, nil
}

// รับ Map แล้ววนอัปเดตทีละตัว
func (s *settingService) UpdateSettings(newSettings map[string]string) error {
	for key, value := range newSettings {
		setting := &domain.SystemSetting{
			Key:   key,
			Value: value,
		}
		if err := s.repo.Upsert(setting); err != nil {
			return err
		}
	}
	return nil
}
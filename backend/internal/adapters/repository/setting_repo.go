package repository

import (
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type settingRepo struct {
	db *gorm.DB
}

func NewSettingRepository(db *gorm.DB) ports.SettingRepository {
	return &settingRepo{db: db}
}

func (r *settingRepo) GetAll() ([]domain.SystemSetting, error) {
	var settings []domain.SystemSetting
	err := r.db.Find(&settings).Error
	return settings, err
}

func (r *settingRepo) GetByKey(key string) (*domain.SystemSetting, error) {
	var setting domain.SystemSetting
	err := r.db.Where("key = ?", key).First(&setting).Error
	return &setting, err
}

func (r *settingRepo) Upsert(setting *domain.SystemSetting) error {
	// ถ้ามี key นี้อยู่แล้ว ให้อัปเดต value ถ้าไม่มีให้สร้างใหม่
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "key"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "group"}),
	}).Create(setting).Error
}
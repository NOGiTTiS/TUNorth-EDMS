package domain

import "gorm.io/gorm"

type SystemSetting struct {
	gorm.Model
	Key   string `gorm:"uniqueIndex;not null" json:"key"`
	Value string `gorm:"type:text" json:"value"`
	Group string `json:"group"` // e.g., "general", "theme", "telegram"
}

// Predefined Keys (Constants)
const (
	SettingSchoolName    = "school_name"
	SettingSchoolLogo    = "school_logo"
	SettingTelegramToken = "telegram_token"
	SettingThemeColor    = "theme_color_main"
)
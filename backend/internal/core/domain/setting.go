package domain

import "gorm.io/gorm"

type SystemSetting struct {
	gorm.Model
	Key   string `gorm:"uniqueIndex;not null" json:"key"`
	Value string `gorm:"type:text" json:"value"`
	Group string `gorm:"type:varchar(50)" json:"group"` // e.g., general, images, theme, document, telegram
}

// กำหนด Constants สำหรับ Key ต่างๆ ป้องกันการพิมพ์ผิด
const (
	// ทั่วไป
	SetSystemName        = "system_name"
	SetSystemDescription = "system_description"
	SetCopyright         = "copyright"

	// รูปภาพ
	SetLogoUrl    = "logo_url"
	SetFaviconUrl = "favicon_url"

	// ธีม
	SetThemeMainColor   = "theme_main_color"
	SetThemeBgGradStart = "theme_bg_gradient_start" // เปลี่ยนเป็น Start
	SetThemeBgGradEnd   = "theme_bg_gradient_end"   // เปลี่ยนเป็น End
	SetThemeStyle       = "theme_style"

	// ตั้งค่าเอกสาร
	SetDocNumberFormat = "doc_number_format" // continuous, yearly

	// Telegram
	SetTelegramToken    = "telegram_token"
	SetTelegramUsername = "telegram_username"
	SetNotifyEnabled    = "notification_enabled" // on, off
	SetFrontendURL      = "frontend_url"
)

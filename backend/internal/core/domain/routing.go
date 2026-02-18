package domain

import (
	"time"
	"gorm.io/gorm"
)

type ActionType string

const (
	ActionAck      ActionType = "ack"      // ทราบ
	ActionApprove  ActionType = "approve"  // อนุมัติ/อนุญาต
	ActionAgree    ActionType = "agree"    // เห็นชอบตามเสนอ
	ActionAssign   ActionType = "assign"   // มอบหมาย/สั่งการ
)

type DocumentRoute struct {
	gorm.Model
	DocID          uint       `gorm:"not null" json:"doc_id"`
	SenderID       uint       `gorm:"not null" json:"sender_id"`     // ผู้ส่ง (เช่น ธุรการกลาง)
	ReceiverID     *uint      `json:"receiver_id"`                   // ผู้รับ (เช่น ผอ.) - อาจเป็น Null ถ้าส่งเข้าฝ่าย
	ReceiverDeptID *uint      `json:"receiver_dept_id"`              // ส่งเข้าฝ่าย (เช่น ส่งให้ธุรการฝ่ายงบฯ)
	
	ActionType     ActionType `gorm:"type:varchar(20)" json:"action_type"` // สิ่งที่เลือก (ทราบ/อนุมัติ...)
	CommandNote    string     `gorm:"type:text" json:"command_note"`       // ข้อความสั่งการ
	IsRead         bool       `gorm:"default:false" json:"is_read"`        // เปิดอ่านหรือยัง
	ActionDate     *time.Time `json:"action_date"`                         // เวลาที่กดสั่งการ
	
	SignatureSnap  string     `json:"signature_snap"` // Snapshot ลายเซ็น ณ ขณะนั้น (เผื่อ User เปลี่ยนลายเซ็นทีหลัง)
	
	// Relationships
	Sender       User        `gorm:"foreignKey:SenderID" json:"sender"`
	Receiver     *User       `gorm:"foreignKey:ReceiverID" json:"receiver"`
	ReceiverDept *Department `gorm:"foreignKey:ReceiverDeptID" json:"receiver_dept"`
}
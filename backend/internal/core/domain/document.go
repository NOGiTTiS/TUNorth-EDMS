package domain

import (
	"time"

	"gorm.io/gorm"
)

type DocStatus string

const (
	StatusPendingDirector DocStatus = "pending_director" // รอ ผอ. สั่งการ
	StatusDirectorSigned  DocStatus = "director_signed"  // ผอ. สั่งการแล้ว (รอธุรการกลางส่งต่อ)
	StatusDistributed     DocStatus = "distributed"      // ส่งต่อธุรการฝ่ายแล้ว (ถึงธุรการฝ่าย)
	StatusPendingDeputy   DocStatus = "pending_deputy"   // รอ รองฯ ฝ่าย สั่งการ
	StatusDeputySigned    DocStatus = "deputy_signed"    // รองฯ สั่งการแล้ว (กลับมาธุรการฝ่าย)
	StatusSentToHead      DocStatus = "sent_to_head"     // ส่งหัวหน้างาน
	StatusCompleted       DocStatus = "completed"        // จบกระบวนการ
)

type Document struct {
	gorm.Model
	ReceiveNo     string    `gorm:"uniqueIndex;not null" json:"receive_no"` // เลขทะเบียนรับ
	ReceiveDate   time.Time `gorm:"not null" json:"receive_date"`           // วันที่ลงรับ
	DocNo         string    `json:"doc_no"`                                 // ที่ (เลขหนังสือภายนอก)
	DocDate       time.Time `json:"doc_date"`                               // ลงวันที่
	From          string    `json:"from"`                                   // จาก
	To            string    `json:"to"`                                     // ถึง
	Subject       string    `json:"subject"`                                // เรื่อง
	FilePath      string    `json:"file_path"`                              // ไฟล์ PDF ต้นฉบับ
	PhysicalStore string    `json:"physical_store"`                         // เก็บต้นฉบับที่ไหน
	Status        DocStatus `gorm:"type:varchar(20);default:'pending_director'" json:"status"`

	// Relationships
	CreatedByID uint            `json:"created_by_id"`
	CreatedBy   User            `gorm:"foreignKey:CreatedByID" json:"created_by"`
	Routings    []DocumentRoute `gorm:"foreignKey:DocID" json:"routings"`
}

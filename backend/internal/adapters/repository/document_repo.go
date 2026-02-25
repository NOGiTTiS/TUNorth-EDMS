package repository

import (
	"time"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"gorm.io/gorm"
)

type documentRepo struct {
	db *gorm.DB
}

func NewDocumentRepository(db *gorm.DB) ports.DocumentRepository {
	return &documentRepo{db: db}
}

func (r *documentRepo) Create(doc *domain.Document) error {
	return r.db.Create(doc).Error
}

func (r *documentRepo) SearchDocuments(q ports.DocumentQuery) (*ports.PaginatedDocument, error) {
	var docs []domain.Document
	var total int64

	db := r.db.Model(&domain.Document{})

	// --- เพิ่ม Logic กรองตามฝ่าย ---
	if q.FilterUserID > 0 {
		// กรองเฉพาะหนังสือที่ส่งมาถึง User คนนี้โดยตรง (ReceiverID)
		db = db.Joins("JOIN document_routes ON document_routes.doc_id = documents.id").
			Where("document_routes.receiver_id = ?", q.FilterUserID).
			Group("documents.id")
	} else if q.FilterDeptID > 0 {
		// กรองตามฝ่าย (สำหรับ ธุรการฝ่าย / รองฯ)
		db = db.Joins("JOIN document_routes ON document_routes.doc_id = documents.id").
			Where("document_routes.receiver_dept_id = ?", q.FilterDeptID).
			Group("documents.id")
	}
	// ---------------------------

	// Logic ค้นหาเดิม
	if q.Search != "" {
		searchTerm := "%" + q.Search + "%"
		db = db.Where("(documents.subject ILIKE ? OR documents.receive_no ILIKE ? OR documents.doc_no ILIKE ? OR documents.from ILIKE ?)", searchTerm, searchTerm, searchTerm, searchTerm)
	}

	if q.Year > 0 {
		db = db.Where("EXTRACT(YEAR FROM documents.receive_date) = ?", q.Year)
	}
	if q.Month > 0 {
		db = db.Where("EXTRACT(MONTH FROM documents.receive_date) = ?", q.Month)
	}

	db.Count(&total)

	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 20
	}
	offset := (q.Page - 1) * q.Limit

	// Preload และ Order เหมือนเดิม
	err := db.Preload("CreatedBy").
		Order("documents.created_at desc").
		Limit(q.Limit).
		Offset(offset).
		Find(&docs).Error

	totalPages := int((total + int64(q.Limit) - 1) / int64(q.Limit))

	return &ports.PaginatedDocument{
		Data:       docs,
		Total:      total,
		Page:       q.Page,
		TotalPages: totalPages,
	}, err
}

func (r *documentRepo) FindByID(id uint) (*domain.Document, error) {
	var doc domain.Document
	// Preload Routings เพื่อดูประวัติการส่ง, Preload Sender ของ Route
	err := r.db.Preload("CreatedBy").
		Preload("Routings.Sender").   // ดึงชื่อคนส่ง
		Preload("Routings.Receiver"). // ดึงชื่อคนรับ
		First(&doc, id).Error
	return &doc, err
}

func (r *documentRepo) UpdateStatus(id uint, status domain.DocStatus) error {
	return r.db.Model(&domain.Document{}).Where("id = ?", id).Update("status", status).Error
}

func (r *documentRepo) CreateRoute(route *domain.DocumentRoute) error {
	return r.db.Create(route).Error
}

func (r *documentRepo) GetAllDepartments() ([]domain.Department, error) {
	var depts []domain.Department
	err := r.db.Find(&depts).Error
	return depts, err
}

func (r *documentRepo) GetDepartmentsByIDs(ids []uint) ([]domain.Department, error) {
	var depts []domain.Department
	err := r.db.Where("id IN ?", ids).Find(&depts).Error
	return depts, err
}

func (r *documentRepo) Update(doc *domain.Document) error {
	// ใช้ gorm.DB.Save() ซึ่งจะอัปเดตทุก field ของ struct ที่ส่งเข้ามา
	return r.db.Save(doc).Error
}

func (r *documentRepo) Delete(id uint) error {
	// 1. ลบประวัติการเดินหนังสือ (Routes) ที่เกี่ยวข้องกับหนังสือนั้นออกก่อนแบบถาวร
	r.db.Unscoped().Where("doc_id = ?", id).Delete(&domain.DocumentRoute{})

	// 2. ลบข้อมูลหนังสือหลักออกด้วยคำสั่ง Unscoped() ซึ่งหมายถึง Hard Delete (ลบถาวรจาก DB)
	return r.db.Unscoped().Delete(&domain.Document{}, id).Error
}

func (r *documentRepo) FindLastDocument() (*domain.Document, error) {
	var doc domain.Document
	// เรียงตาม ID ล่าสุด (Desc) เอาแค่ 1 ตัว
	err := r.db.Order("id desc").First(&doc).Error
	return &doc, err
}

func (r *documentRepo) CreateDepartment(dept *domain.Department) error {
	return r.db.Create(dept).Error
}

func (r *documentRepo) UpdateDepartment(dept *domain.Department) error {
	return r.db.Save(dept).Error
}

func (r *documentRepo) DeleteDepartment(id uint) error {
	return r.db.Delete(&domain.Department{}, id).Error
}

func (r *documentRepo) IsDocumentInDept(docID uint, deptID uint) (bool, error) {
	var count int64
	// เช็คว่ามี Route ไหนที่ส่งมา DeptID นี้หรือไม่
	err := r.db.Model(&domain.DocumentRoute{}).
		Where("doc_id = ? AND receiver_dept_id = ?", docID, deptID).
		Count(&count).Error
	return count > 0, err
}

func (r *documentRepo) IsDocumentAssignedToUser(docID uint, userID uint) (bool, error) {
	var count int64
	// เช็คว่ามี Route ไหนที่ส่งหา UserID นี้โดยตรงหรือไม่
	err := r.db.Model(&domain.DocumentRoute{}).
		Where("doc_id = ? AND receiver_id = ?", docID, userID).
		Count(&count).Error
	return count > 0, err
}

func (r *documentRepo) GetDashboardStats(userID uint, role string, deptID *uint) (*ports.DashboardStats, error) {
	stats := &ports.DashboardStats{}

	// 1. นับจำนวนหนังสือทั้งหมดในเดือนปัจจุบัน (Total Month)
	// (นับเฉพาะที่ Active ไม่โดนลบ)
	currentMonth := time.Now().Month()
	currentYear := time.Now().Year()
	r.db.Model(&domain.Document{}).
		Where("EXTRACT(MONTH FROM receive_date) = ? AND EXTRACT(YEAR FROM receive_date) = ?", currentMonth, currentYear).
		Count(&stats.TotalMonth)

	// 2. นับจำนวนงานค้าง (Pending Works) ตาม Role
	pendingQuery := r.db.Model(&domain.Document{})

	switch role {
	case string(domain.RoleDirector):
		// ผอ.: นับสถานะ "pending_director" ทั้งหมด
		pendingQuery.Where("status = ?", domain.StatusPendingDirector).Count(&stats.PendingWorks)

	case string(domain.RoleAdminCentral):
		// ธุรการกลาง: นับสถานะ "director_signed" (รอส่งต่อ)
		pendingQuery.Where("status = ?", domain.StatusDirectorSigned).Count(&stats.PendingWorks)

	case string(domain.RoleAdminDept):
		// ธุรการฝ่าย: นับทั้ง "distributed" (รอเสนอรอง) และ "deputy_signed" (รอส่งหัวหน้า)
		if deptID != nil {
			pendingQuery.Joins("JOIN document_routes ON document_routes.doc_id = documents.id").
				Where("documents.status IN (?, ?) AND document_routes.receiver_dept_id = ?", 
					domain.StatusDistributed,    // สถานะที่ 1
					domain.StatusDeputySigned,   // สถานะที่ 2 (เพิ่มอันนี้)
					*deptID).
				Group("documents.id").Count(&stats.PendingWorks)
		}

	case string(domain.RoleDeputy):
		// รองฯ: นับ "pending_deputy" (รอรองสั่งการ) + ต้องเป็นฝ่ายตัวเอง
		if deptID != nil {
			pendingQuery.Joins("JOIN document_routes ON document_routes.doc_id = documents.id").
				Where("documents.status = ? AND document_routes.receiver_dept_id = ?", domain.StatusPendingDeputy, *deptID).
				Group("documents.id").Count(&stats.PendingWorks)
		}

	case string(domain.RoleHead):
		// หัวหน้างาน: นับ "sent_to_head" + ต้องส่งถึงตัวเอง (ReceiverID)
		pendingQuery.Joins("JOIN document_routes ON document_routes.doc_id = documents.id").
			Where("documents.status = ? AND document_routes.receiver_id = ?", domain.StatusSentToHead, userID).
			Group("documents.id").Count(&stats.PendingWorks)
	}

	// ==========================================
	// 3. ดึงสถิติรายเดือน (กราฟ) - เฉพาะปีปัจจุบัน
	// ==========================================
	var monthly []ports.MonthlyStat

	// Query Group By เดือน
	err := r.db.Model(&domain.Document{}).
		Select("CAST(EXTRACT(MONTH FROM receive_date) AS INTEGER) as month, count(*) as count").
		Where("EXTRACT(YEAR FROM receive_date) = ?", time.Now().Year()).
		Group("month").
		Order("month").
		Scan(&monthly).Error

	if err == nil {
		stats.MonthlyStats = monthly
	}

	return stats, nil
}

func (r *documentRepo) GetReportStats(start, end string) (*ports.ReportStats, error) {
	stats := &ports.ReportStats{}

	// แปลงวันที่ให้ครอบคลุมทั้งวัน (00:00:00 - 23:59:59)
	startDate := start + " 00:00:00"
	endDate := end + " 23:59:59"

	// 1. จำนวนหนังสือทั้งหมดในช่วงเวลา (ดักจับ Error)
	if err := r.db.Model(&domain.Document{}).
		Where("receive_date BETWEEN ? AND ?", startDate, endDate).
		Count(&stats.TotalDocs).Error; err != nil {
		return nil, err
	}

	// 2. แยกตามสถานะ (Pie Chart) (ดักจับ Error)
	if err := r.db.Model(&domain.Document{}).
		Select("status as name, count(*) as value").
		Where("receive_date BETWEEN ? AND ?", startDate, endDate).
		Group("status").
		Scan(&stats.ByStatus).Error; err != nil {
		return nil, err
	}

	// 3. แยกตามฝ่ายที่รับผิดชอบ (Bar Chart) (ดักจับ Error)
	if err := r.db.Table("document_routes").
		Select("departments.name as name, count(*) as value").
		Joins("JOIN departments ON departments.id = document_routes.receiver_dept_id").
		Where("document_routes.created_at BETWEEN ? AND ?", startDate, endDate).
		Group("departments.name").
		Order("value desc").
		Scan(&stats.ByDepartment).Error; err != nil {
		return nil, err
	}

	return stats, nil
}

func (r *documentRepo) GetLogbookReport(month int, year int) ([]domain.Document, error) {
	var docs []domain.Document
	db := r.db.Model(&domain.Document{})

	if year > 0 {
		db = db.Where("EXTRACT(YEAR FROM receive_date) = ?", year)
	}
	if month > 0 {
		db = db.Where("EXTRACT(MONTH FROM receive_date) = ?", month)
	}

	// ดึงข้อมูล Routings และ ReceiverDept เพื่อนำไปแสดงในช่อง "การปฏิบัติ"
	err := db.Preload("Routings.ReceiverDept").
		Order("receive_date ASC, id ASC"). // เรียงตามวันที่ลงรับและ ID (แทนลำดับการจด)
		Find(&docs).Error

	return docs, err
}

func (r *documentRepo) GetDeptReportStats(deptID uint, start, end string) (*ports.DeptReportStats, error) {
	stats := &ports.DeptReportStats{}
	startDate := start + " 00:00:00"
	endDate := end + " 23:59:59"

	// 1. จำนวนหนังสือที่รับเข้าฝ่ายทั้งหมดในช่วงเวลา
	// ดูจาก Route ที่ receiver_dept_id = deptID
	if err := r.db.Model(&domain.DocumentRoute{}).
		Where("receiver_dept_id = ? AND created_at BETWEEN ? AND ?", deptID, startDate, endDate).
		Count(&stats.TotalReceived).Error; err != nil {
		return nil, err
	}

	// 2. แยกตามสถานะ (เฉพาะหนังสือที่อยู่ในฝ่ายนี้)
	// Join กับ Document เพื่อดู status ปัจจุบัน
	if err := r.db.Table("document_routes").
		Select("documents.status as name, count(documents.id) as value").
		Joins("JOIN documents ON documents.id = document_routes.doc_id").
		Where("document_routes.receiver_dept_id = ? AND document_routes.created_at BETWEEN ? AND ?", deptID, startDate, endDate).
		Group("documents.status").
		Scan(&stats.ByStatus).Error; err != nil {
		return nil, err
	}

	// 3. ภาระงานแยกตามหัวหน้างาน (ใครรับงานไปเยอะสุด)
	// ดู Route ที่ sender เป็นคนในฝ่ายนี้ และ action = assigned (ส่งให้หัวหน้า)
	// ต้อง Join กับ Users เพื่อเอาชื่อหัวหน้า (Receiver)
	if err := r.db.Table("document_routes").
		Select("users.full_name as name, count(*) as value").
		Joins("JOIN users ON users.id = document_routes.receiver_id").
		Where("users.department_id = ? AND document_routes.created_at BETWEEN ? AND ?", deptID, startDate, endDate).
		Group("users.full_name").
		Order("value desc").
		Scan(&stats.ByHead).Error; err != nil {
		return nil, err
	}

	return stats, nil
}
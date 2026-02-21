package ports

import "tunorth-edms-backend/internal/core/domain"

// UserRepository: สิ่งที่ Database ต้องทำได้เกี่ยวกับ User
type UserRepository interface {
	FindByUsername(username string) (*domain.User, error)
	CreateUser(user *domain.User) error
	FindByID(id uint) (*domain.User, error)
}

// AuthService: Business Logic ของการ Login
type AuthService interface {
	Login(username, password string) (string, error) // Return JWT Token
}
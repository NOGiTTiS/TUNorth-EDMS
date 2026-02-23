package ports

import "tunorth-edms-backend/internal/core/domain"

// UserRepository: สิ่งที่ Database ต้องทำได้เกี่ยวกับ User
type UserRepository interface {
	FindByUsername(username string) (*domain.User, error)
	CreateUser(user *domain.User) error
	FindByID(id uint) (*domain.User, error)
	FindAll() ([]domain.User, error)
	Update(user *domain.User) error
	Delete(id uint) error
	FindByRole(role string) ([]domain.User, error)
	FindByDeptAndRole(deptID uint, role string) ([]domain.User, error)
}

// AuthService: Business Logic ของการ Login
type AuthService interface {
	Login(username, password string) (string, error) // Return JWT Token
}

type UserService interface {
	GetAllUsers(role string, deptID uint) ([]domain.User, error) 
	CreateUser(user *domain.User) error
	UpdateUser(id uint, user *domain.User) error
	DeleteUser(id uint) error
	UpdateProfile(id uint, fullName, password string) error // สำหรับ Profile
}
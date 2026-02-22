package services

import (
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"
	"golang.org/x/crypto/bcrypt"
)

type userService struct {
	repo ports.UserRepository
}

func NewUserService(repo ports.UserRepository) ports.UserService {
	return &userService{repo: repo}
}

func (s *userService) GetAllUsers() ([]domain.User, error) {
	return s.repo.FindAll()
}

func (s *userService) CreateUser(user *domain.User) error {
	hashed, _ := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	user.Password = string(hashed)
	return s.repo.CreateUser(user)
}

func (s *userService) UpdateUser(id uint, updateData *domain.User) error {
	user, err := s.repo.FindByID(id)
	if err != nil { return err }

	user.FullName = updateData.FullName
	user.Username = updateData.Username
	user.Role = updateData.Role
	user.Position = updateData.Position
	user.DepartmentID = updateData.DepartmentID
	user.TelegramChatID = updateData.TelegramChatID

	// เปลี่ยนรหัสผ่านถ้ามีการส่งมาใหม่
	if updateData.Password != "" {
		hashed, _ := bcrypt.GenerateFromPassword([]byte(updateData.Password), bcrypt.DefaultCost)
		user.Password = string(hashed)
	}
	return s.repo.Update(user)
}

func (s *userService) DeleteUser(id uint) error {
	return s.repo.Delete(id)
}

func (s *userService) UpdateProfile(id uint, fullName, password string) error {
	user, err := s.repo.FindByID(id)
	if err != nil { return err }

	user.FullName = fullName
	if password != "" {
		hashed, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		user.Password = string(hashed)
	}
	return s.repo.Update(user)
}
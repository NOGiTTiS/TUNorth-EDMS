package repository

import (
	"errors"
	"tunorth-edms-backend/internal/core/domain"
	"tunorth-edms-backend/internal/core/ports"

	"gorm.io/gorm"
)

type userRepo struct {
	db *gorm.DB
}

// Constructor function
func NewUserRepository(db *gorm.DB) ports.UserRepository {
	return &userRepo{db: db}
}

func (r *userRepo) FindByUsername(username string) (*domain.User, error) {
	var user domain.User
	// Preload Department เพื่อดึงข้อมูลฝ่ายมาด้วยเลย
	result := r.db.Preload("Department").Where("username = ?", username).First(&user)
	
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, result.Error
	}
	
	return &user, nil
}

func (r *userRepo) CreateUser(user *domain.User) error {
	return r.db.Create(user).Error
}

func (r *userRepo) FindByID(id uint) (*domain.User, error) {
	var user domain.User
	result := r.db.Preload("Department").First(&user, id)
	
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, result.Error
	}
	
	return &user, nil
}

func (r *userRepo) FindAll() ([]domain.User, error) {
	var users []domain.User
	err := r.db.Preload("Department").Find(&users).Error
	return users, err
}

func (r *userRepo) Update(user *domain.User) error {
	return r.db.Save(user).Error
}

func (r *userRepo) Delete(id uint) error {
	return r.db.Delete(&domain.User{}, id).Error
}

func (r *userRepo) FindByRole(role string) ([]domain.User, error) {
	var users []domain.User
	err := r.db.Where("role = ?", role).Find(&users).Error
	return users, err
}
package services

import (
	"errors"
	"time"
	"tunorth-edms-backend/internal/core/ports"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type authService struct {
	userRepo ports.UserRepository
}

func NewAuthService(userRepo ports.UserRepository) ports.AuthService {
	return &authService{userRepo: userRepo}
}

// Secret Key ควรเก็บใน ENV แต่เพื่อความง่ายใน Tutorial นี้เราจะ Hardcode ไว้ก่อน
var jwtSecret = []byte("my_super_secret_key_tunorth_edms")

func (s *authService) Login(username, password string) (string, error) {
	// 1. Find User
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	// 2. Check Password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("invalid credentials")
	}

	// 3. Generate JWT Token
	deptID := uint(0)
	if user.DepartmentID != nil {
		deptID = *user.DepartmentID
	}

	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role,
		"dept_id":  deptID,
		"full_name": user.FullName, // ส่งชื่อไปแสดงหน้าเว็บ
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token อายุ 24 ชม.
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return t, nil
}
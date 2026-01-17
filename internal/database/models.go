package database

import (
	"time"

	"gorm.io/gorm"
)

// Product represents a simple product model for demonstration.
type Product struct {
	gorm.Model
	Code  string `json:"code" gorm:"unique"`
	Price uint   `json:"price"`
}

// UserRole constants
const (
	RoleAdmin = "admin"
	RoleUser  = "user"
)

// User represents a user in the system, primarily authenticated via OIDC.
type User struct {
	gorm.Model
	Email        string   `json:"email" gorm:"unique;index"`
	Name         string   `json:"name"`
	PasswordHash string   `json:"-"`                          // Hashed password for email login
	InternalID   *string  `json:"internal_id" gorm:"index"`   // OIDC 'sub' claim (nil for email/password users)
	Role         string   `json:"role" gorm:"default:'user'"` // "admin" or "user"
	APIKeys      []APIKey `json:"-"`
}

// APIKey represents a programmatic access key for a user.
type APIKey struct {
	gorm.Model
	UserID    uint       `json:"user_id" gorm:"index"`
	Name      string     `json:"name"`
	Prefix    string     `json:"prefix"`                // First few chars of the key for identification
	KeyHash   string     `json:"-" gorm:"unique;index"` // SHA256 hash of the raw key
	Scopes    string     `json:"scopes"`                // JSON string of scopes
	LastUsed  *time.Time `json:"last_used"`
	ExpiresAt *time.Time `json:"expires_at"`
}

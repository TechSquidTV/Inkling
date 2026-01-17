package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/techsquidtv/inkling/internal/config"
)

// HashKey returns the SHA256 hash of a raw API key.
func HashKey(key string) string {
	hash := sha256.Sum256([]byte(key))
	return hex.EncodeToString(hash[:])
}

// GenerateAPIKey is a placeholder for generating a secure random key.
// In a real app, you'd use crypto/rand.
func GenerateAPIKey() string {
	// For demonstration, but should be replaced with random bytes
	return fmt.Sprintf("%s%s", config.APIKeyPrefix, hex.EncodeToString([]byte("random-bytes-here")))
}

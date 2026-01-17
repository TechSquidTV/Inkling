package middleware

import (
	"context"
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/auth"
	"github.com/techsquidtv/inkling/internal/database"
	"gorm.io/gorm"
)

type UserContextKey struct{}

// NewAuthMiddleware creates a new authentication middleware.
func NewAuthMiddleware(db *gorm.DB) func(huma.Context, func(huma.Context)) {
	return func(ctx huma.Context, next func(huma.Context)) {
		var user *database.User

		// 1. Check X-API-Key
		apiKey := ctx.Header("X-API-Key")
		if apiKey != "" {
			hash := auth.HashKey(apiKey)
			var keyRecord database.APIKey
			if err := db.Where("key_hash = ?", hash).First(&keyRecord).Error; err == nil {
				// Key found, get user
				if err := db.First(&user, keyRecord.UserID).Error; err == nil {
					// User found
				}
			}
		}

		// 2. Check Authorization Bearer (if not already authenticated by API Key)
		if user == nil {
			authHeader := ctx.Header("Authorization")
			if after, ok := strings.CutPrefix(authHeader, "Bearer "); ok {
				token := after
				claims, err := auth.ValidateJWT(token)
				if err == nil {
					if err := db.First(&user, claims.UserID).Error; err == nil {
						// User found
					}
				}
			}
		}

		// If authenticated, store user in context
		if user != nil {
			ctx = huma.WithValue(ctx, UserContextKey{}, user)
		}

		next(ctx)
	}
}

// GetUser retrieves the user from the context.
func GetUser(ctx context.Context) *database.User {
	user, _ := ctx.Value(UserContextKey{}).(*database.User)
	return user
}

// RequireAuth checks if a user is authenticated and returns an error if not.
func RequireAuth(ctx context.Context) (*database.User, error) {
	user := GetUser(ctx)
	if user == nil {
		return nil, huma.Error401Unauthorized("unauthorized")
	}
	return user, nil
}

// RequireAdmin checks if the authenticated user has admin role.
// Returns error if not authenticated or not an admin.
func RequireAdmin(ctx context.Context) (*database.User, error) {
	user, err := RequireAuth(ctx)
	if err != nil {
		return nil, err
	}
	if user.Role != database.RoleAdmin {
		return nil, huma.Error403Forbidden("admin access required")
	}
	return user, nil
}

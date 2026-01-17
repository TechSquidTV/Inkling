package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/middleware"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserOutput represents the response for user info.
type UserOutput struct {
	Body struct {
		ID          uint   `json:"id"`
		Email       string `json:"email"`
		Name        string `json:"name"`
		Role        string `json:"role"`
		HasPassword bool   `json:"has_password" doc:"Whether user has a password set (false for OIDC-only users)"`
	}
}

// UpdateProfileInput represents the request to update profile.
type UpdateProfileInput struct {
	Body struct {
		Name  *string `json:"name,omitempty" doc:"New display name"`
		Email *string `json:"email,omitempty" format:"email" doc:"New email address"`
	}
}

// ChangePasswordInput represents the request to change password.
type ChangePasswordInput struct {
	Body struct {
		CurrentPassword string `json:"current_password" required:"true" doc:"Current password for verification"`
		NewPassword     string `json:"new_password" minLength:"8" required:"true" doc:"New password (min 8 chars)"`
	}
}

// RegisterUser registers user-related endpoints.
func RegisterUser(api huma.API, db *gorm.DB) {
	// GET /api/me - Get current user info
	huma.Register(api, huma.Operation{
		OperationID: "get-current-user",
		Method:      http.MethodGet,
		Path:        "/me",
		Summary:     "Get current user info",
		Description: "Returns the authenticated user's information including role.",
		Tags:        []string{"User"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *struct{}) (*UserOutput, error) {
		user, err := middleware.RequireAuth(ctx)
		if err != nil {
			return nil, err
		}

		resp := &UserOutput{}
		resp.Body.ID = user.ID
		resp.Body.Email = user.Email
		resp.Body.Name = user.Name
		resp.Body.Role = user.Role
		resp.Body.HasPassword = user.PasswordHash != ""
		return resp, nil
	})

	// PUT /api/me - Update current user profile
	huma.Register(api, huma.Operation{
		OperationID: "update-profile",
		Method:      http.MethodPut,
		Path:        "/me",
		Summary:     "Update profile",
		Description: "Update the current user's name and/or email.",
		Tags:        []string{"User"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *UpdateProfileInput) (*UserOutput, error) {
		user, err := middleware.RequireAuth(ctx)
		if err != nil {
			return nil, err
		}

		// Update fields if provided
		if input.Body.Name != nil {
			user.Name = *input.Body.Name
		}
		if input.Body.Email != nil {
			// Check if email is already taken
			var existingUser database.User
			if err := db.Where("email = ? AND id != ?", *input.Body.Email, user.ID).First(&existingUser).Error; err == nil {
				return nil, huma.Error409Conflict("email already in use")
			}
			user.Email = *input.Body.Email
		}

		if err := db.Save(user).Error; err != nil {
			return nil, huma.Error500InternalServerError("failed to update profile", err)
		}

		resp := &UserOutput{}
		resp.Body.ID = user.ID
		resp.Body.Email = user.Email
		resp.Body.Name = user.Name
		resp.Body.Role = user.Role
		return resp, nil
	})

	// PUT /api/me/password - Change password
	huma.Register(api, huma.Operation{
		OperationID: "change-password",
		Method:      http.MethodPut,
		Path:        "/me/password",
		Summary:     "Change password",
		Description: "Change the current user's password. Requires current password for verification.",
		Tags:        []string{"User"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *ChangePasswordInput) (*struct{}, error) {
		user, err := middleware.RequireAuth(ctx)
		if err != nil {
			return nil, err
		}

		// Verify current password
		if user.PasswordHash == "" {
			return nil, huma.Error400BadRequest("password change not available for OIDC users")
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Body.CurrentPassword)); err != nil {
			return nil, huma.Error401Unauthorized("incorrect current password")
		}

		// Hash new password
		hash, err := bcrypt.GenerateFromPassword([]byte(input.Body.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to hash password", err)
		}

		// Update password
		user.PasswordHash = string(hash)
		if err := db.Save(user).Error; err != nil {
			return nil, huma.Error500InternalServerError("failed to update password", err)
		}

		return nil, nil
	})
}

package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/middleware"
	"gorm.io/gorm"
)

// AdminSettingsOutput represents the response for admin settings.
type AdminSettingsOutput struct {
	Body struct {
		RegistrationEnabled bool `json:"registration_enabled" doc:"Whether user registration is enabled"`
	}
}

// UpdateAdminSettingsInput represents the request to update admin settings.
type UpdateAdminSettingsInput struct {
	Body struct {
		RegistrationEnabled *bool `json:"registration_enabled,omitempty" doc:"Enable or disable user registration"`
	}
}

// RegisterAdmin registers admin-only endpoints.
func RegisterAdmin(api huma.API, db *gorm.DB) {
	// GET /api/admin/settings - Get admin settings
	huma.Register(api, huma.Operation{
		OperationID: "get-admin-settings",
		Method:      http.MethodGet,
		Path:        "/admin/settings",
		Summary:     "Get admin settings",
		Description: "Retrieve application settings. Requires admin role.",
		Tags:        []string{"Admin"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *struct{}) (*AdminSettingsOutput, error) {
		// Verify admin access
		if _, err := middleware.RequireAdmin(ctx); err != nil {
			return nil, err
		}

		resp := &AdminSettingsOutput{}
		resp.Body.RegistrationEnabled = database.IsRegistrationEnabled(db)
		return resp, nil
	})

	// PUT /api/admin/settings - Update admin settings
	huma.Register(api, huma.Operation{
		OperationID: "update-admin-settings",
		Method:      http.MethodPut,
		Path:        "/admin/settings",
		Summary:     "Update admin settings",
		Description: "Update application settings. Requires admin role.",
		Tags:        []string{"Admin"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *UpdateAdminSettingsInput) (*AdminSettingsOutput, error) {
		// Verify admin access
		if _, err := middleware.RequireAdmin(ctx); err != nil {
			return nil, err
		}

		// Update registration setting if provided
		if input.Body.RegistrationEnabled != nil {
			if err := database.SetRegistrationEnabled(db, *input.Body.RegistrationEnabled); err != nil {
				return nil, huma.Error500InternalServerError("failed to update settings", err)
			}
		}

		resp := &AdminSettingsOutput{}
		resp.Body.RegistrationEnabled = database.IsRegistrationEnabled(db)
		return resp, nil
	})
}

package handlers_test

import (
	"net/http"
	"testing"

	"github.com/danielgtaylor/huma/v2/humatest"
	"github.com/stretchr/testify/assert"
	"github.com/techsquidtv/inkling/internal/api/handlers"
	"github.com/techsquidtv/inkling/internal/auth"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/middleware"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAdminTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	db.AutoMigrate(&database.User{}, &database.APIKey{}, &database.AppSettings{})
	return db
}

func TestFirstUserBecomesAdmin(t *testing.T) {
	db := setupAdminTestDB(t)
	_, api := humatest.New(t)

	// Mock OIDC Provider
	mockOIDC := &MockProvider{}

	// Register Auth Handlers
	handlers.RegisterAuth(api, db, mockOIDC)

	// First user signup
	signupData := map[string]interface{}{
		"email":    "first@example.com",
		"password": "password123",
		"name":     "First User",
	}
	resp := api.Post("/auth/signup", signupData)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Verify first user is admin
	var firstUser database.User
	db.Where("email = ?", "first@example.com").First(&firstUser)
	assert.Equal(t, database.RoleAdmin, firstUser.Role)

	// Second user signup
	signupData["email"] = "second@example.com"
	signupData["name"] = "Second User"
	resp = api.Post("/auth/signup", signupData)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Verify second user is NOT admin
	var secondUser database.User
	db.Where("email = ?", "second@example.com").First(&secondUser)
	assert.Equal(t, database.RoleUser, secondUser.Role)
}

func TestRegistrationDisabled(t *testing.T) {
	db := setupAdminTestDB(t)
	_, api := humatest.New(t)

	// Mock OIDC Provider
	mockOIDC := &MockProvider{}

	// Create first user manually (admin)
	db.Create(&database.User{
		Email: "admin@example.com",
		Name:  "Admin User",
		Role:  database.RoleAdmin,
	})

	// Disable registration
	database.SetRegistrationEnabled(db, false)

	// Register Auth Handlers
	handlers.RegisterAuth(api, db, mockOIDC)

	// Try to signup (should fail)
	signupData := map[string]interface{}{
		"email":    "new@example.com",
		"password": "password123",
		"name":     "New User",
	}
	resp := api.Post("/auth/signup", signupData)
	assert.Equal(t, http.StatusForbidden, resp.Code)
}

func TestAdminSettingsEndpoints(t *testing.T) {
	db := setupAdminTestDB(t)
	_, api := humatest.New(t)

	// Create admin user
	adminUser := database.User{
		Email: "admin@example.com",
		Name:  "Admin User",
		Role:  database.RoleAdmin,
	}
	db.Create(&adminUser)

	// Create non-admin user
	normalUser := database.User{
		Email: "user@example.com",
		Name:  "Normal User",
		Role:  database.RoleUser,
	}
	db.Create(&normalUser)

	// Register handlers with middleware
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterAdmin(api, db)

	// Generate tokens
	adminToken, _ := auth.GenerateJWT(adminUser.ID)
	userToken, _ := auth.GenerateJWT(normalUser.ID)

	// Test: Admin can GET settings
	resp := api.Get("/admin/settings", "Authorization: Bearer "+adminToken)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Test: Non-admin cannot GET settings
	resp = api.Get("/admin/settings", "Authorization: Bearer "+userToken)
	assert.Equal(t, http.StatusForbidden, resp.Code)

	// Test: Admin can PUT settings
	updateData := map[string]interface{}{
		"registration_enabled": false,
	}
	resp = api.Put("/admin/settings", updateData, "Authorization: Bearer "+adminToken)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Verify setting was updated
	assert.False(t, database.IsRegistrationEnabled(db))

	// Test: Non-admin cannot PUT settings
	updateData["registration_enabled"] = true
	resp = api.Put("/admin/settings", updateData, "Authorization: Bearer "+userToken)
	assert.Equal(t, http.StatusForbidden, resp.Code)

	// Verify setting was NOT changed by non-admin
	assert.False(t, database.IsRegistrationEnabled(db))
}

func TestAdminSettingsUnauthenticated(t *testing.T) {
	db := setupAdminTestDB(t)
	_, api := humatest.New(t)

	// Register handlers with middleware
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterAdmin(api, db)

	// Test: Unauthenticated request should fail
	resp := api.Get("/admin/settings")
	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

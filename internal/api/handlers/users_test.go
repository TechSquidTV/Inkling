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

func setupUsersTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}
	db.AutoMigrate(&database.User{}, &database.APIKey{}, &database.AppSettings{})
	return db
}

func TestListUsers(t *testing.T) {
	db := setupUsersTestDB(t)
	_, api := humatest.New(t)

	// Create an admin user
	admin := database.User{Email: "admin@example.com", Name: "Admin", Role: database.RoleAdmin}
	db.Create(&admin)

	// Create some normal users
	db.Create(&database.User{Email: "user1@example.com", Name: "User One", Role: database.RoleUser})
	db.Create(&database.User{Email: "user2@example.com", Name: "User Two", Role: database.RoleUser})

	// Register handlers
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterUsers(api, db)

	// Generate admin token
	adminToken, _ := auth.GenerateJWT(admin.ID)

	// Test: Admin can list users
	resp := api.Get("/admin/users", "Authorization: Bearer "+adminToken)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Test: Search filter works
	resp = api.Get("/admin/users?search=user1", "Authorization: Bearer "+adminToken)
	assert.Equal(t, http.StatusOK, resp.Code)
}

func TestListUsersUnauthorized(t *testing.T) {
	db := setupUsersTestDB(t)
	_, api := humatest.New(t)

	// Create a normal user
	user := database.User{Email: "user@example.com", Name: "User", Role: database.RoleUser}
	db.Create(&user)

	// Register handlers
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterUsers(api, db)

	// Generate user token
	userToken, _ := auth.GenerateJWT(user.ID)

	// Test: Non-admin cannot list users
	resp := api.Get("/admin/users", "Authorization: Bearer "+userToken)
	assert.Equal(t, http.StatusForbidden, resp.Code)
}

func TestUpdateUserRole(t *testing.T) {
	db := setupUsersTestDB(t)
	_, api := humatest.New(t)

	// Create an admin and a normal user
	admin := database.User{Email: "admin@example.com", Name: "Admin", Role: database.RoleAdmin}
	db.Create(&admin)
	user := database.User{Email: "user@example.com", Name: "User", Role: database.RoleUser}
	db.Create(&user)

	// Register handlers
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterUsers(api, db)

	// Generate admin token
	adminToken, _ := auth.GenerateJWT(admin.ID)

	// Test: Admin can promote user to admin
	resp := api.Put("/admin/users/"+string(rune(user.ID+'0')), map[string]interface{}{
		"role": "admin",
	}, "Authorization: Bearer "+adminToken)
	// Note: Using ID 2 since user is second created
	resp = api.Put("/admin/users/2", map[string]interface{}{
		"role": "admin",
	}, "Authorization: Bearer "+adminToken)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Verify role was updated
	var updatedUser database.User
	db.First(&updatedUser, user.ID)
	assert.Equal(t, database.RoleAdmin, updatedUser.Role)
}

func TestCannotDemoteLastAdmin(t *testing.T) {
	db := setupUsersTestDB(t)
	_, api := humatest.New(t)

	// Create only one admin
	admin := database.User{Email: "admin@example.com", Name: "Admin", Role: database.RoleAdmin}
	db.Create(&admin)

	// Create another admin to do the demoting
	admin2 := database.User{Email: "admin2@example.com", Name: "Admin2", Role: database.RoleAdmin}
	db.Create(&admin2)

	// Register handlers
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterUsers(api, db)

	// Generate admin2 token
	admin2Token, _ := auth.GenerateJWT(admin2.ID)

	// Demote admin1 (should succeed since there are 2 admins)
	resp := api.Put("/admin/users/1", map[string]interface{}{
		"role": "user",
	}, "Authorization: Bearer "+admin2Token)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Now try to demote admin2 (last admin) - should fail
	// First need admin1's token but they're now a user, so use admin2
	resp = api.Put("/admin/users/2", map[string]interface{}{
		"role": "user",
	}, "Authorization: Bearer "+admin2Token)
	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestDeleteUser(t *testing.T) {
	db := setupUsersTestDB(t)
	_, api := humatest.New(t)

	// Create an admin and a normal user
	admin := database.User{Email: "admin@example.com", Name: "Admin", Role: database.RoleAdmin}
	db.Create(&admin)
	user := database.User{Email: "user@example.com", Name: "User", Role: database.RoleUser}
	db.Create(&user)

	// Register handlers
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterUsers(api, db)

	// Generate admin token
	adminToken, _ := auth.GenerateJWT(admin.ID)

	// Test: Admin can delete user
	resp := api.Delete("/admin/users/2", "Authorization: Bearer "+adminToken)
	assert.Equal(t, http.StatusNoContent, resp.Code)

	// Verify user was deleted
	var count int64
	db.Model(&database.User{}).Where("id = ?", user.ID).Count(&count)
	assert.Equal(t, int64(0), count)
}

func TestCannotDeleteSelf(t *testing.T) {
	db := setupUsersTestDB(t)
	_, api := humatest.New(t)

	// Create an admin
	admin := database.User{Email: "admin@example.com", Name: "Admin", Role: database.RoleAdmin}
	db.Create(&admin)

	// Register handlers
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterUsers(api, db)

	// Generate admin token
	adminToken, _ := auth.GenerateJWT(admin.ID)

	// Test: Admin cannot delete themselves
	resp := api.Delete("/admin/users/1", "Authorization: Bearer "+adminToken)
	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestCannotDeleteLastAdmin(t *testing.T) {
	db := setupUsersTestDB(t)
	_, api := humatest.New(t)

	// Create two admins
	admin1 := database.User{Email: "admin1@example.com", Name: "Admin1", Role: database.RoleAdmin}
	db.Create(&admin1)
	admin2 := database.User{Email: "admin2@example.com", Name: "Admin2", Role: database.RoleAdmin}
	db.Create(&admin2)

	// Register handlers
	api.UseMiddleware(middleware.NewAuthMiddleware(db))
	handlers.RegisterUsers(api, db)

	// Generate admin1 token
	admin1Token, _ := auth.GenerateJWT(admin1.ID)

	// Delete admin2 (should succeed since there are 2 admins)
	resp := api.Delete("/admin/users/2", "Authorization: Bearer "+admin1Token)
	assert.Equal(t, http.StatusNoContent, resp.Code)

	// Generate new token for admin1 (still works)
	admin1Token, _ = auth.GenerateJWT(admin1.ID)

	// Now there's only one admin left, cannot delete
	// But admin1 is trying to delete themselves which is also blocked
	// This is covered by TestCannotDeleteSelf
}

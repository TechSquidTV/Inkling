package handlers_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/humatest"
	"github.com/stretchr/testify/assert"
	"github.com/techsquidtv/inkling/internal/api/handlers"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/middleware"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}
	db.AutoMigrate(&database.User{}, &database.APIKey{})
	return db
}

func TestAPIKeys_CreateAndList(t *testing.T) {
	db := setupTestDB(t)
	_, api := humatest.New(t)

	// Create test user
	user := database.User{
		Email: "test@example.com",
		Name:  "Test User",
	}
	db.Create(&user)

	// Middleware to inject user into context
	api.UseMiddleware(func(ctx huma.Context, next func(huma.Context)) {
		ctx = huma.WithValue(ctx, middleware.UserContextKey{}, &user)
		next(ctx)
	})

	handlers.RegisterAPIKeys(api, db)

	// Test Create Key with Name
	createInput := map[string]interface{}{
		"name": "My Test Key",
	}
	resp := api.Post("/keys", createInput)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Check that the key starts with "sk_live_"
	assert.Contains(t, resp.Body.String(), "sk_live_")

	// Test List Keys
	resp = api.Get("/keys")
	assert.Equal(t, http.StatusOK, resp.Code)
	assert.Contains(t, resp.Body.String(), "My Test Key")

	// Unmarshal to verify structure strongly
	var listResp struct {
		Keys []handlers.APIKey `json:"keys"`
	}
	err := json.Unmarshal(resp.Body.Bytes(), &listResp)
	assert.NoError(t, err)
	assert.Len(t, listResp.Keys, 1)
	assert.Equal(t, "My Test Key", listResp.Keys[0].Name)

	// Test Create Key WITHOUT Name
	createInputNoName := map[string]interface{}{}
	resp = api.Post("/keys", createInputNoName)
	assert.Equal(t, http.StatusOK, resp.Code)

	// List again
	resp = api.Get("/keys")
	assert.Equal(t, http.StatusOK, resp.Code)

	err = json.Unmarshal(resp.Body.Bytes(), &listResp)
	assert.NoError(t, err)
	assert.Len(t, listResp.Keys, 2)
}

func TestAPIKeys_Revoke(t *testing.T) {
	db := setupTestDB(t)
	_, api := humatest.New(t)

	user := database.User{Email: "revoke@example.com", Name: "Revoke User"}
	db.Create(&user)

	// Inject user
	api.UseMiddleware(func(ctx huma.Context, next func(huma.Context)) {
		ctx = huma.WithValue(ctx, middleware.UserContextKey{}, &user)
		next(ctx)
	})

	handlers.RegisterAPIKeys(api, db)

	// Create a key manually
	apiKey := database.APIKey{
		UserID:  user.ID,
		Name:    "Key to Revoke",
		Prefix:  "sk_live_1234",
		KeyHash: "somehash",
	}
	db.Create(&apiKey)

	// Revoke it
	resp := api.Delete(fmt.Sprintf("/keys/%d", apiKey.ID))
	assert.Equal(t, http.StatusNoContent, resp.Code)

	// Verify it's gone from DB
	var count int64
	db.Model(&database.APIKey{}).Where("id = ?", apiKey.ID).Count(&count)
	assert.Equal(t, int64(0), count)

	// Verify list is empty
	resp = api.Get("/keys")
	var listResp struct {
		Keys []handlers.APIKey `json:"keys"`
	}
	json.Unmarshal(resp.Body.Bytes(), &listResp)
	assert.Len(t, listResp.Keys, 0)
}

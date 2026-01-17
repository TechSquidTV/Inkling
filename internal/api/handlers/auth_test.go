package handlers_test

import (
	"context"
	"net/http"
	"testing"

	"github.com/danielgtaylor/huma/v2/humatest"
	"github.com/stretchr/testify/assert"
	"github.com/techsquidtv/inkling/internal/api/handlers"
	"github.com/techsquidtv/inkling/internal/auth"
	"github.com/techsquidtv/inkling/internal/database"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// MockIDToken implements auth.IDToken
type MockIDToken struct {
	ClaimsFunc func(v interface{}) error
}

func (m *MockIDToken) Claims(v interface{}) error {
	return m.ClaimsFunc(v)
}

// MockProvider implements auth.Provider
type MockProvider struct {
	AuthCodeURLFunc func(state string) string
	ExchangeFunc    func(ctx context.Context, code string) (*oauth2.Token, error)
	VerifyTokenFunc func(ctx context.Context, rawIDToken string) (auth.IDToken, error)
}

func (m *MockProvider) AuthCodeURL(state string) string {
	return m.AuthCodeURLFunc(state)
}

func (m *MockProvider) Exchange(ctx context.Context, code string) (*oauth2.Token, error) {
	return m.ExchangeFunc(ctx, code)
}

func (m *MockProvider) VerifyToken(ctx context.Context, rawIDToken string) (auth.IDToken, error) {
	return m.VerifyTokenFunc(ctx, rawIDToken)
}

func TestRegisterAuth_Callback(t *testing.T) {
	// Setup DB
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&database.User{}, &database.APIKey{})

	// Setup Huma API
	_, api := humatest.New(t)

	// Mock OIDC Provider
	mockOIDC := &MockProvider{
		ExchangeFunc: func(ctx context.Context, code string) (*oauth2.Token, error) {
			return (&oauth2.Token{
				AccessToken: "fake-access-token",
			}).WithExtra(map[string]interface{}{
				"id_token": "fake-id-token",
			}), nil
		},
		VerifyTokenFunc: func(ctx context.Context, rawIDToken string) (auth.IDToken, error) {
			return &MockIDToken{
				ClaimsFunc: func(v interface{}) error {
					claims := v.(*struct {
						Email string `json:"email"`
						Name  string `json:"name"`
						Sub   string `json:"sub"`
					})
					claims.Email = "test@example.com"
					claims.Name = "Test User"
					claims.Sub = "test-sub-123"
					return nil
				},
			}, nil
		},
	}

	// Register Auth Handlers
	handlers.RegisterAuth(api, db, mockOIDC)

	// Test Callback
	resp := api.Get("/auth/callback?code=test-code&state=test-state")

	assert.Equal(t, http.StatusOK, resp.Code)

	// Verify User was created in DB
	var user database.User
	result := db.Where("internal_id = ?", "test-sub-123").First(&user)
	assert.NoError(t, result.Error)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, "Test User", user.Name)
}

func TestRegisterAuth_Signup(t *testing.T) {
	// Setup DB
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&database.User{}, &database.APIKey{})

	// Setup Huma API
	_, api := humatest.New(t)

	// Mock OIDC Provider (not used for signup but required by RegisterAuth)
	mockOIDC := &MockProvider{}

	// Register Auth Handlers
	handlers.RegisterAuth(api, db, mockOIDC)

	// Test Signup
	signupData := map[string]interface{}{
		"email":    "signup@example.com",
		"password": "password123",
		"name":     "Signup User",
	}
	resp := api.Post("/auth/signup", signupData)

	assert.Equal(t, http.StatusOK, resp.Code)

	// Verify User was created in DB
	var user database.User
	result := db.Where("email = ?", "signup@example.com").First(&user)
	assert.NoError(t, result.Error)
	assert.Equal(t, "Signup User", user.Name)
	assert.NotEmpty(t, user.PasswordHash)

	// Verify password was hashed (not stored as plain text)
	assert.NotEqual(t, "password123", user.PasswordHash)
}

func TestRegisterAuth_Login(t *testing.T) {
	// Setup DB
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&database.User{}, &database.APIKey{})

	// Setup Huma API
	_, api := humatest.New(t)

	// Mock OIDC Provider
	mockOIDC := &MockProvider{}

	// Register Auth Handlers
	handlers.RegisterAuth(api, db, mockOIDC)

	// Create a user first
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	db.Create(&database.User{
		Email:        "login@example.com",
		PasswordHash: string(hash),
		Name:         "Login User",
	})

	// Test Successful Login
	loginData := map[string]interface{}{
		"email":    "login@example.com",
		"password": "password123",
	}
	resp := api.Post("/auth/login", loginData)
	assert.Equal(t, http.StatusOK, resp.Code)

	// Test Invalid Password
	loginData["password"] = "wrongpassword"
	resp = api.Post("/auth/login", loginData)
	assert.Equal(t, http.StatusUnauthorized, resp.Code)

	// Test Non-existent User
	loginData["email"] = "nonexistent@example.com"
	resp = api.Post("/auth/login", loginData)
	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

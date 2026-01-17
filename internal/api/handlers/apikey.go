package handlers

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/middleware"
	"gorm.io/gorm"
)

type APIKey struct {
	ID        uint       `json:"id"`
	Name      string     `json:"name"`
	Prefix    string     `json:"prefix"`
	LastUsed  *time.Time `json:"last_used,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type ListKeysOutput struct {
	Body struct {
		Keys []APIKey `json:"keys"`
	}
}

type CreateKeyInput struct {
	Body struct {
		Name string `json:"name,omitempty" doc:"Optional name for the key"`
	}
}

type CreateKeyOutput struct {
	Body struct {
		Key string `json:"key" doc:"The raw API key. This is only returned once."`
	}
}

// RegisterAPIKeys registers the API key management endpoints.
func RegisterAPIKeys(api huma.API, db *gorm.DB) {
	// List Keys
	huma.Register(api, huma.Operation{
		OperationID: "list-api-keys",
		Method:      http.MethodGet,
		Path:        "/keys",
		Summary:     "List API Keys",
		Tags:        []string{"API Keys"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *struct{}) (*ListKeysOutput, error) {
		user := middleware.GetUser(ctx)
		if user == nil {
			return nil, huma.Error401Unauthorized("unauthorized")
		}

		var keys []database.APIKey
		if err := db.Where("user_id = ?", user.ID).Find(&keys).Error; err != nil {
			return nil, huma.Error500InternalServerError("database error", err)
		}

		resp := &ListKeysOutput{}
		resp.Body.Keys = make([]APIKey, len(keys))
		for i, k := range keys {
			resp.Body.Keys[i] = APIKey{
				ID:        k.ID,
				Name:      k.Name,
				Prefix:    k.Prefix,
				CreatedAt: k.CreatedAt,
				LastUsed:  k.LastUsed,
			}
		}

		return resp, nil
	})

	// Create Key
	huma.Register(api, huma.Operation{
		OperationID: "create-api-key",
		Method:      http.MethodPost,
		Path:        "/keys",
		Summary:     "Create API Key",
		Tags:        []string{"API Keys"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *CreateKeyInput) (*CreateKeyOutput, error) {
		user := middleware.GetUser(ctx)
		if user == nil {
			return nil, huma.Error401Unauthorized("unauthorized")
		}

		// Generate random key
		bytes := make([]byte, 32)
		if _, err := rand.Read(bytes); err != nil {
			return nil, huma.Error500InternalServerError("failed to generate key", err)
		}
		rawKey := "sk_live_" + hex.EncodeToString(bytes)

		// Hash key
		hash := sha256.Sum256([]byte(rawKey))
		hashString := hex.EncodeToString(hash[:])

		apiKey := database.APIKey{
			UserID:  user.ID,
			KeyHash: hashString,
			Name:    input.Body.Name,
			Prefix:  rawKey[:12],
		}

		if err := db.Create(&apiKey).Error; err != nil {
			return nil, huma.Error500InternalServerError("failed to create key", err)
		}

		return &CreateKeyOutput{
			Body: struct {
				Key string `json:"key" doc:"The raw API key. This is only returned once."`
			}{
				Key: rawKey,
			},
		}, nil
	})

	// Revoke Key
	huma.Register(api, huma.Operation{
		OperationID: "revoke-api-key",
		Method:      http.MethodDelete,
		Path:        "/keys/{id}",
		Summary:     "Revoke API Key",
		Tags:        []string{"API Keys"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *struct {
		ID uint `path:"id"`
	}) (*struct{}, error) {
		user := middleware.GetUser(ctx)
		if user == nil {
			return nil, huma.Error401Unauthorized("unauthorized")
		}

		result := db.Where("id = ? AND user_id = ?", input.ID, user.ID).Delete(&database.APIKey{})
		if result.Error != nil {
			return nil, huma.Error500InternalServerError("database error", result.Error)
		}
		if result.RowsAffected == 0 {
			return nil, huma.Error404NotFound("key not found")
		}

		return nil, nil
	})
}

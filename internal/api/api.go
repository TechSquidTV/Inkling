package api

import (
	"github.com/danielgtaylor/huma/v2"
	"github.com/go-chi/chi/v5"
	"github.com/techsquidtv/inkling/internal/api/handlers"
	"github.com/techsquidtv/inkling/internal/auth"
	"github.com/techsquidtv/inkling/internal/logs"
	"gorm.io/gorm"
)

// RegisterHandlers registers all API handlers.
func RegisterHandlers(api huma.API, router chi.Router, db *gorm.DB, oidc *auth.OIDCProvider, logService logs.Service) {
	handlers.RegisterHealth(api)
	handlers.RegisterVersion(api)
	handlers.RegisterGreeting(api)
	handlers.RegisterProducts(api, db)
	handlers.RegisterAPIKeys(api, db)
	handlers.RegisterAuth(api, db, oidc)
	handlers.RegisterAdmin(api, db)
	handlers.RegisterUser(api, db)
	handlers.RegisterUsers(api, db)
	handlers.RegisterLogs(router, logService)
}

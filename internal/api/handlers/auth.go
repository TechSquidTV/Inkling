package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/auth"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/logging"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type LoginOutput struct {
	Status   int    `json:"-"`
	Location string `header:"Location"`
}

type CallbackOutput struct {
	Body struct {
		Token string `json:"token"`
	}
}

// RegisterAuth registers the login and callback handlers.
func RegisterAuth(api huma.API, db *gorm.DB, oidc auth.Provider) {
	// Login endpoint - redirects to OIDC provider
	huma.Register(api, huma.Operation{
		OperationID: "login",
		Method:      http.MethodGet,
		Path:        "/auth/login",
		Summary:     "Login with OIDC",
		Tags:        []string{"Auth", "public"},
	}, func(ctx context.Context, input *struct{}) (*LoginOutput, error) {
		if oidc == nil {
			return nil, huma.Error501NotImplemented("OIDC is not configured")
		}
		url := oidc.AuthCodeURL("state") // In production, use a real state
		return &LoginOutput{
			Status:   http.StatusFound,
			Location: url,
		}, nil
	})

	// Callback endpoint - handles the redirect from OIDC provider
	huma.Register(api, huma.Operation{
		OperationID: "callback",
		Method:      http.MethodGet,
		Path:        "/auth/callback",
		Summary:     "OIDC Callback",
		Tags:        []string{"Auth", "public"},
	}, func(ctx context.Context, input *struct {
		Code  string `query:"code"`
		State string `query:"state"`
	}) (*CallbackOutput, error) {
		if oidc == nil {
			return nil, huma.Error501NotImplemented("OIDC is not configured")
		}
		// 1. Exchange code for token
		oauth2Token, err := oidc.Exchange(ctx, input.Code)
		if err != nil {
			return nil, huma.Error401Unauthorized("failed to exchange token", err)
		}

		// 2. Extract and verify ID Token
		rawIDToken, ok := oauth2Token.Extra("id_token").(string)
		if !ok {
			return nil, huma.Error401Unauthorized("no id_token in response")
		}

		idToken, err := oidc.VerifyToken(ctx, rawIDToken)
		if err != nil {
			return nil, huma.Error401Unauthorized("failed to verify id_token", err)
		}

		// 3. Get user info from claims
		var claims struct {
			Email string `json:"email"`
			Name  string `json:"name"`
			Sub   string `json:"sub"`
		}
		if err := idToken.Claims(&claims); err != nil {
			return nil, huma.Error401Unauthorized("failed to parse claims", err)
		}

		// 4. Provision or get user
		var user database.User
		result := db.Where("internal_id = ?", claims.Sub).First(&user)
		if result.Error == gorm.ErrRecordNotFound {
			// Check if registration is enabled (skip for first user)
			var userCount int64
			db.Model(&database.User{}).Count(&userCount)
			if userCount > 0 && !database.IsRegistrationEnabled(db) {
				return nil, huma.Error403Forbidden("user registration is disabled")
			}

			// Determine role: first user is admin
			role := database.RoleUser
			if userCount == 0 {
				role = database.RoleAdmin
			}

			user = database.User{
				Email:      claims.Email,
				Name:       claims.Name,
				InternalID: &claims.Sub,
				Role:       role,
			}
			if err := db.Create(&user).Error; err != nil {
				return nil, huma.Error500InternalServerError("failed to create user", err)
			}
		} else if result.Error != nil {
			return nil, huma.Error500InternalServerError("database error", result.Error)
		}

		// 5. Issue internal JWT
		token, err := auth.GenerateJWT(user.ID)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to generate token", err)
		}

		resp := &CallbackOutput{}
		resp.Body.Token = token
		return resp, nil
	})

	// Signup endpoint - handles email/password registration
	huma.Register(api, huma.Operation{
		OperationID: "signup",
		Method:      http.MethodPost,
		Path:        "/auth/signup",
		Summary:     "Register a new user",
		Tags:        []string{"Auth", "public"},
	}, func(ctx context.Context, input *struct {
		Body struct {
			Email    string `json:"email" format:"email" required:"true"`
			Password string `json:"password" minLength:"8" required:"true"`
			Name     string `json:"name" minLength:"2" required:"true"`
		}
	}) (*CallbackOutput, error) {
		// 1. Check if registration is enabled (skip for first user)
		var userCount int64
		db.Model(&database.User{}).Count(&userCount)
		if userCount > 0 && !database.IsRegistrationEnabled(db) {
			return nil, huma.Error403Forbidden("user registration is disabled")
		}

		// 2. Check if user already exists
		var existing database.User
		if err := db.Where("email = ?", input.Body.Email).First(&existing).Error; err == nil {
			return nil, huma.Error409Conflict("user with this email already exists")
		}

		// 3. Hash password
		hash, err := bcrypt.GenerateFromPassword([]byte(input.Body.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to hash password", err)
		}

		// 4. Determine role: first user is admin
		role := database.RoleUser
		if userCount == 0 {
			role = database.RoleAdmin
		}

		// 5. Create user
		user := database.User{
			Email:        input.Body.Email,
			PasswordHash: string(hash),
			Name:         input.Body.Name,
			Role:         role,
		}
		if err := db.Create(&user).Error; err != nil {
			logging.FromContext(ctx).Error("failed to create user", logging.Email, user.Email, logging.Error, err)
			return nil, huma.Error500InternalServerError("failed to create user", err)
		}

		logging.FromContext(ctx).Info("new user signed up", logging.Email, user.Email)

		// 4. Issue internal JWT
		token, err := auth.GenerateJWT(user.ID)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to generate token", err)
		}

		resp := &CallbackOutput{}
		resp.Body.Token = token
		return resp, nil
	})

	// Login endpoint - handles email/password authentication
	huma.Register(api, huma.Operation{
		OperationID: "login-email",
		Method:      http.MethodPost,
		Path:        "/auth/login",
		Summary:     "Login with email and password",
		Tags:        []string{"Auth", "public"},
	}, func(ctx context.Context, input *struct {
		Body struct {
			Email    string `json:"email" format:"email" required:"true"`
			Password string `json:"password" required:"true"`
		}
	}) (*CallbackOutput, error) {
		// 1. Find user by email
		var user database.User
		if err := db.Where("email = ?", input.Body.Email).First(&user).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, huma.Error401Unauthorized("invalid email or password")
			}
			return nil, huma.Error500InternalServerError("database error", err)
		}

		// 2. Verify password
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Body.Password)); err != nil {
			logging.FromContext(ctx).Warn("failed login attempt", logging.Email, input.Body.Email, "reason", "invalid password")
			return nil, huma.Error401Unauthorized("invalid email or password")
		}

		logging.FromContext(ctx).Info("user logged in", logging.Email, user.Email, logging.UserID, user.ID)

		// 3. Issue internal JWT
		token, err := auth.GenerateJWT(user.ID)
		if err != nil {
			return nil, huma.Error500InternalServerError("failed to generate token", err)
		}

		resp := &CallbackOutput{}
		resp.Body.Token = token
		return resp, nil
	})
}

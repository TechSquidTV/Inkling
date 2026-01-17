package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/middleware"
	"gorm.io/gorm"
)

// UserInfo represents user data for admin listing.
type UserInfo struct {
	ID        uint      `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// ListUsersOutput represents the paginated user list response.
type ListUsersOutput struct {
	Body struct {
		Users []UserInfo `json:"users"`
		Total int64      `json:"total"`
	}
}

// UpdateUserRoleInput represents the request to update a user's role.
type UpdateUserRoleInput struct {
	ID   uint `path:"id" doc:"User ID"`
	Body struct {
		Role string `json:"role" enum:"admin,user" required:"true" doc:"New role for the user"`
	}
}

// DeleteUserInput represents the request to delete a user.
type DeleteUserInput struct {
	ID uint `path:"id" doc:"User ID"`
}

// RegisterUsers registers admin user management endpoints.
func RegisterUsers(api huma.API, db *gorm.DB) {
	// GET /api/admin/users - List all users (admin-only)
	huma.Register(api, huma.Operation{
		OperationID: "list-users",
		Method:      http.MethodGet,
		Path:        "/admin/users",
		Summary:     "List all users",
		Description: "Returns a list of all users. Requires admin role.",
		Tags:        []string{"Admin"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *struct {
		Search string `query:"search" doc:"Search by email or name"`
		Limit  int    `query:"limit" default:"50" doc:"Maximum number of users to return"`
		Offset int    `query:"offset" default:"0" doc:"Offset for pagination"`
	}) (*ListUsersOutput, error) {
		if _, err := middleware.RequireAdmin(ctx); err != nil {
			return nil, err
		}

		var users []database.User
		var total int64

		query := db.Model(&database.User{})

		// Apply search filter
		if input.Search != "" {
			searchPattern := "%" + input.Search + "%"
			query = query.Where("email LIKE ? OR name LIKE ?", searchPattern, searchPattern)
		}

		// Get total count
		query.Count(&total)

		// Apply pagination and fetch
		if err := query.Limit(input.Limit).Offset(input.Offset).Order("created_at DESC").Find(&users).Error; err != nil {
			return nil, huma.Error500InternalServerError("failed to fetch users", err)
		}

		// Convert to UserInfo
		userInfos := make([]UserInfo, len(users))
		for i, u := range users {
			userInfos[i] = UserInfo{
				ID:        u.ID,
				Email:     u.Email,
				Name:      u.Name,
				Role:      u.Role,
				CreatedAt: u.CreatedAt,
			}
		}

		resp := &ListUsersOutput{}
		resp.Body.Users = userInfos
		resp.Body.Total = total
		return resp, nil
	})

	// PUT /api/admin/users/:id - Update user role (admin-only)
	huma.Register(api, huma.Operation{
		OperationID: "update-user-role",
		Method:      http.MethodPut,
		Path:        "/admin/users/{id}",
		Summary:     "Update user role",
		Description: "Update a user's role. Requires admin role. Cannot demote the last admin.",
		Tags:        []string{"Admin"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *UpdateUserRoleInput) (*UserOutput, error) {
		admin, err := middleware.RequireAdmin(ctx)
		if err != nil {
			return nil, err
		}

		// Find the user to update
		var user database.User
		if err := db.First(&user, input.ID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, huma.Error404NotFound("user not found")
			}
			return nil, huma.Error500InternalServerError("failed to fetch user", err)
		}

		// Prevent demoting the last admin
		if user.Role == database.RoleAdmin && input.Body.Role == database.RoleUser {
			var adminCount int64
			db.Model(&database.User{}).Where("role = ?", database.RoleAdmin).Count(&adminCount)
			if adminCount <= 1 {
				return nil, huma.Error400BadRequest("cannot demote the last admin")
			}
		}

		// Prevent self-demotion
		if admin.ID == user.ID && input.Body.Role != user.Role {
			return nil, huma.Error400BadRequest("cannot change your own role")
		}

		// Update role
		user.Role = input.Body.Role
		if err := db.Save(&user).Error; err != nil {
			return nil, huma.Error500InternalServerError("failed to update user", err)
		}

		resp := &UserOutput{}
		resp.Body.ID = user.ID
		resp.Body.Email = user.Email
		resp.Body.Name = user.Name
		resp.Body.Role = user.Role
		return resp, nil
	})

	// DELETE /api/admin/users/:id - Delete user (admin-only)
	huma.Register(api, huma.Operation{
		OperationID: "delete-user",
		Method:      http.MethodDelete,
		Path:        "/admin/users/{id}",
		Summary:     "Delete user",
		Description: "Delete a user. Requires admin role. Cannot delete yourself.",
		Tags:        []string{"Admin"},
		Security: []map[string][]string{
			{"bearerAuth": {}},
		},
	}, func(ctx context.Context, input *DeleteUserInput) (*struct{}, error) {
		admin, err := middleware.RequireAdmin(ctx)
		if err != nil {
			return nil, err
		}

		// Prevent self-deletion
		if admin.ID == input.ID {
			return nil, huma.Error400BadRequest("cannot delete yourself")
		}

		// Check if user exists
		var user database.User
		if err := db.First(&user, input.ID).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				return nil, huma.Error404NotFound("user not found")
			}
			return nil, huma.Error500InternalServerError("failed to fetch user", err)
		}

		// Prevent deleting the last admin
		if user.Role == database.RoleAdmin {
			var adminCount int64
			db.Model(&database.User{}).Where("role = ?", database.RoleAdmin).Count(&adminCount)
			if adminCount <= 1 {
				return nil, huma.Error400BadRequest("cannot delete the last admin")
			}
		}

		// Delete user and their API keys
		if err := db.Delete(&database.APIKey{}, "user_id = ?", input.ID).Error; err != nil {
			return nil, huma.Error500InternalServerError("failed to delete user API keys", err)
		}
		if err := db.Delete(&user).Error; err != nil {
			return nil, huma.Error500InternalServerError("failed to delete user", err)
		}

		return nil, nil
	})
}

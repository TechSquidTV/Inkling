# Adding a New Route

Follow these steps to add a new API endpoint to the project.

## 1. Create a Handler File
Create a new file in `internal/api/handlers/`. For example, `internal/api/handlers/ping.go`.

## 2. Define Input and Output Models
Define the request input (if any) and response output structs. Huma uses tags like `path`, `query`, and `json` to map data.

```go
package handlers

import (
	"context"
	"github.com/danielgtaylor/huma/v2"
)

type PingInput struct {
	Type string `query:"type" enum:"simple,full" default:"simple" doc:"Type of ping"`
}

type PingOutput struct {
	Body struct {
		Message string `json:"message" example:"pong"`
	}
}
```

## 3. Implement the Registration Function
Create a function that takes `huma.API` and registers the route.

```go
func RegisterPing(api huma.API) {
	huma.Get(api, "/api/ping", func(ctx context.Context, input *PingInput) (*PingOutput, error) {
		resp := &PingOutput{}
		resp.Body.Message = "pong"
		return resp, nil
	})
}
```

## 4. Register the Handler in `api.go`
Open `internal/api/api.go` and call your new registration function inside `RegisterHandlers`. Ensure you pass the `*gorm.DB` instance.

```go
func RegisterHandlers(api huma.API, db *gorm.DB) {
	handlers.RegisterHealth(api)
	handlers.RegisterGreeting(api)
	handlers.RegisterPing(api, db) // Pass db if needed
}
```

## 5. Verify
Start the server and test your new endpoint:
```bash
go run cmd/server/main.go
curl http://localhost:8080/api/ping?type=simple
```
Check the auto-generated documentation at `http://localhost:8080/docs` to see your new route.

## Protected Routes

To secure an endpoint so that only authenticated users can access it, you need to add the `Security` field to the operation definition and use the `middleware.GetUser` helper.

### 1. Add Security to Registration
When registering the route, add the `Security` scheme `bearerAuth`.

```go
import (
	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/middleware"
)

func RegisterProtectedPing(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "protected-ping",
		Method:      http.MethodGet,
		Path:        "/api/protected/ping",
		Summary:     "Ping (Protected)",
		Security: []map[string][]string{
			{"bearerAuth": {}}, // Requires authentication
		},
	}, func(ctx context.Context, input *struct{}) (*PingOutput, error) {
		// 2. Get User from Context
		user := middleware.GetUser(ctx)
		if user == nil {
			return nil, huma.Error401Unauthorized("unauthorized")
		}

		resp := &PingOutput{}
		resp.Body.Message = "pong authenticated user: " + user.Email
		return resp, nil
	})
}
```

### 2. Verify Authentication
Endpoints with `bearerAuth` will now require a valid JWT token in the `Authorization` header.

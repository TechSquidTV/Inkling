package handlers

import (
	"context"

	"github.com/danielgtaylor/huma/v2"
)

// HealthOutput represents the health check response.
type HealthOutput struct {
	Body struct {
		Status string `json:"status" example:"ok" doc:"Status of the server"`
	}
}

// RegisterHealth registers the health check handler.
func RegisterHealth(api huma.API) {
	huma.Get(api, "/health", func(ctx context.Context, input *struct{}) (*HealthOutput, error) {
		resp := &HealthOutput{}
		resp.Body.Status = "ok"
		return resp, nil
	})
}

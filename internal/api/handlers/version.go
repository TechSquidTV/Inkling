package handlers

import (
	"context"

	"github.com/danielgtaylor/huma/v2"
	"github.com/techsquidtv/inkling/internal/version"
)

// VersionOutput represents the version response.
type VersionOutput struct {
	Body struct {
		Version   string `json:"version" example:"v0.1.0" doc:"Self-hosted app version"`
		Commit    string `json:"commit" example:"abc123" doc:"Git commit hash"`
		BuildTime string `json:"build_time" example:"2026-01-16T02:30:47-05:00" doc:"Time the binary was built"`
	}
}

// RegisterVersion registers the version handler.
func RegisterVersion(api huma.API) {
	huma.Get(api, "/version", func(ctx context.Context, input *struct{}) (*VersionOutput, error) {
		resp := &VersionOutput{}
		resp.Body.Version = version.Version
		resp.Body.Commit = version.Commit
		resp.Body.BuildTime = version.BuildTime
		return resp, nil
	})
}

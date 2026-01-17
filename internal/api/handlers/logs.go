package handlers

import (
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/techsquidtv/inkling/internal/logs"
)

// LogsHandler handles log streaming requests
type LogsHandler struct {
	logService logs.Service
}

// NewLogsHandler creates a new logs handler
func NewLogsHandler(logService logs.Service) *LogsHandler {
	return &LogsHandler{
		logService: logService,
	}
}

// StreamLogs handles SSE log streaming
// Note: SSE cannot be properly documented in OpenAPI, so we use raw HTTP handler
func (h *LogsHandler) StreamLogs(w http.ResponseWriter, r *http.Request) {
	// Get service name from query parameter
	service := r.URL.Query().Get("service")
	if service == "" {
		service = "application"
	}

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Flush headers
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}

	// Start streaming logs
	ctx := r.Context()
	logCh, err := h.logService.StreamLogs(ctx, service, 50)
	if err != nil {
		// Send error as SSE event
		fmt.Fprintf(w, "event: error\ndata: %s\n\n", err.Error())
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
		return
	}

	// Stream logs until context is cancelled or channel closes
	for {
		select {
		case line, ok := <-logCh:
			if !ok {
				// Channel closed
				return
			}

			// Send log line as SSE data
			fmt.Fprintf(w, "data: %s\n\n", line)
			if flusher, ok := w.(http.Flusher); ok {
				flusher.Flush()
			}

		case <-ctx.Done():
			return
		}
	}
}

// RegisterLogs registers the log streaming handler directly with the Chi router
func RegisterLogs(router chi.Router, logService logs.Service) {
	handler := NewLogsHandler(logService)
	router.Get("/api/logs/stream", handler.StreamLogs)
}

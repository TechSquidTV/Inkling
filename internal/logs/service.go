package logs

import (
	"context"
)

// Service provides streaming access to application and container logs
type Service interface {
	// StreamLogs returns a channel of log lines for the specified service.
	// The channel will be closed when the context is cancelled or an error occurs.
	// tail specifies the number of historical lines to include (0 for none).
	StreamLogs(ctx context.Context, service string, tail int) (<-chan string, error)
}

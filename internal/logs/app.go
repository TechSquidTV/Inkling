package logs

import (
	"container/ring"
	"context"
	"sync"
)

// AppLogService implements Service using an in-memory ring buffer
type AppLogService struct {
	buffer *ring.Ring
	mu     sync.RWMutex
	subs   map[chan string]struct{}
	subsMu sync.RWMutex
}

// NewAppLogService creates a new application log service with the specified buffer size
func NewAppLogService(bufferSize int) *AppLogService {
	return &AppLogService{
		buffer: ring.New(bufferSize),
		subs:   make(map[chan string]struct{}),
	}
}

// Write implements io.Writer to allow integration with slog
func (a *AppLogService) Write(p []byte) (n int, err error) {
	line := string(p)

	a.mu.Lock()
	a.buffer.Value = line
	a.buffer = a.buffer.Next()
	a.mu.Unlock()

	// Broadcast to all subscribers
	a.subsMu.RLock()
	for ch := range a.subs {
		select {
		case ch <- line:
		default:
			// Skip if channel is full (slow consumer)
		}
	}
	a.subsMu.RUnlock()

	return len(p), nil
}

// StreamLogs returns a channel of log lines
func (a *AppLogService) StreamLogs(ctx context.Context, service string, tail int) (<-chan string, error) {
	ch := make(chan string, 100)

	if service != "application" {
		close(ch)
		return ch, nil
	}

	// First, send historical logs
	a.mu.RLock()
	if tail > 0 {
		lines := make([]string, 0, tail)
		a.buffer.Do(func(v interface{}) {
			if v != nil {
				if line, ok := v.(string); ok && line != "" {
					lines = append(lines, line)
				}
			}
		})

		// Send the last N lines
		start := len(lines) - tail
		if start < 0 {
			start = 0
		}
		for i := start; i < len(lines); i++ {
			select {
			case ch <- lines[i]:
			case <-ctx.Done():
				a.mu.RUnlock()
				close(ch)
				return ch, ctx.Err()
			}
		}
	}
	a.mu.RUnlock()

	// Subscribe to new logs
	a.subsMu.Lock()
	a.subs[ch] = struct{}{}
	a.subsMu.Unlock()

	// Clean up on context cancellation
	go func() {
		<-ctx.Done()
		a.subsMu.Lock()
		delete(a.subs, ch)
		a.subsMu.Unlock()
		close(ch)
	}()

	return ch, nil
}

// Close closes all active subscriptions
func (a *AppLogService) Close() error {
	a.subsMu.Lock()
	defer a.subsMu.Unlock()

	for ch := range a.subs {
		close(ch)
		delete(a.subs, ch)
	}

	return nil
}

var _ Service = (*AppLogService)(nil)

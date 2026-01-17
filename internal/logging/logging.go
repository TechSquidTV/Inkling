package logging

import (
	"context"

	"github.com/charmbracelet/log"
)

// Standard log keys
const (
	UserID = "user_id"
	Status = "status"
	Path   = "path"
	Method = "method"
	Error  = "error"
	Email  = "email"
)

type contextKey string

const loggerKey contextKey = "logger"

// FromContext returns the logger stored in the context.
// If no logger is found, it returns the default global logger.
func FromContext(ctx context.Context) *log.Logger {
	if l, ok := ctx.Value(loggerKey).(*log.Logger); ok {
		return l
	}
	return log.Default()
}

// NewContext returns a new context with the given logger stored in it.
func NewContext(ctx context.Context, l *log.Logger) context.Context {
	return context.WithValue(ctx, loggerKey, l)
}

// With returns a new logger with the given key-value pairs.
func With(ctx context.Context, keyvals ...interface{}) *log.Logger {
	return FromContext(ctx).With(keyvals...)
}

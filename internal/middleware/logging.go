package middleware

import (
	"net/http"

	"github.com/charmbracelet/log"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/techsquidtv/inkling/internal/logging"
)

// Logging is a middleware that logs the end of each request as a "fat" milestone
// log, capturing high-cardinality metadata.
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		// Create a logger scoped to this request (can be enriched later)
		l := log.With(
			logging.Method, r.Method,
			logging.Path, r.URL.Path,
		)

		// Inject the logger into the request context
		ctx := logging.NewContext(r.Context(), l)
		r = r.WithContext(ctx)

		defer func() {
			status := ww.Status()
			level := log.InfoLevel
			if status >= 400 && status < 500 {
				level = log.WarnLevel
			} else if status >= 500 {
				level = log.ErrorLevel
			}

			// Final "fat" milestone log
			l.Log(level, "request completed",
				logging.Status, status,
			)
		}()

		next.ServeHTTP(ww, r)
	})
}

// NewLoggingMiddleware returns a new logging middleware handler.
func NewLoggingMiddleware() func(http.Handler) http.Handler {
	return Logging
}

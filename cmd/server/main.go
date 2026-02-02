package main

import (
	"context"
	"embed"
	"fmt"
	"io"
	"io/fs"
	"net/http"
	"os"
	"strings"

	"time"

	"github.com/charmbracelet/log"
	sentryhttp "github.com/getsentry/sentry-go/http"
	"github.com/muesli/termenv"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/danielgtaylor/huma/v2/humacli"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/spf13/cobra"
	"github.com/techsquidtv/inkling/internal/api"
	"github.com/techsquidtv/inkling/internal/auth"
	"github.com/techsquidtv/inkling/internal/config"
	"github.com/techsquidtv/inkling/internal/database"
	"github.com/techsquidtv/inkling/internal/logs"
	appmiddleware "github.com/techsquidtv/inkling/internal/middleware"
	"github.com/techsquidtv/inkling/internal/telemetry"

	_ "github.com/danielgtaylor/huma/v2/formats/cbor"
	"github.com/joho/godotenv"
)

// Options for the CLI.
type Options struct {
	Port        int    `help:"Port to listen on" short:"p" default:"8080"`
	DBPath      string `help:"Path to the SQLite database" default:"app.db"`
	SentryDSN   string `help:"Sentry DSN for error tracking" env:"SENTRY_DSN"`
	MetricsPort int    `help:"Port to serve Prometheus metrics on" default:"9090" env:"METRICS_PORT"`
	Spotlight   bool   `help:"Enable Sentry Spotlight" env:"SENTRY_SPOTLIGHT"`
}

//go:embed all:dist
var distFS embed.FS

func main() {
	// Load .env file if it exists
	godotenv.Load()

	// Force colored logs even when running through tools like air or with redirected output
	os.Setenv("CLICOLOR_FORCE", "1")
	os.Setenv("FORCE_COLOR", "1")

	var humaAPI huma.API

	// Create a CLI app which takes a port option.
	cli := humacli.New(func(hooks humacli.Hooks, options *Options) {
		// Initialize Telemetry
		otelShutdown, err := telemetry.Init(context.Background(), telemetry.Config{
			SentryDSN:   options.SentryDSN,
			MetricsPort: fmt.Sprintf("%d", options.MetricsPort),
			ServiceName: config.ServiceName,
			Spotlight:   options.Spotlight,
		})
		if err != nil {
			log.Warn("failed to initialize telemetry", "err", err)
		} else {
			hooks.OnStop(otelShutdown)
		}

		// Create a new router
		router := chi.NewMux()

		// Initialize Log Service
		enableDockerLogs := os.Getenv("ENABLE_DOCKER_LOGS") == "true"
		var logService logs.Service

		if enableDockerLogs {
			// Try Docker log service
			dockerService, err := logs.NewDockerLogService()
			if err != nil {
				log.Warn("Failed to initialize Docker log service, falling back to app logs", "err", err)
				logService = logs.NewAppLogService(500)
			} else {
				log.Info("Docker log streaming enabled")
				logService = dockerService
			}
		} else {
			logService = logs.NewAppLogService(500)
		}

		// Configure global logger
		log.SetLevel(log.DebugLevel)
		log.SetReportCaller(true)
		log.SetTimeFormat(time.Kitchen)

		// Wire app log service to logger if using AppLogService
		if appLogService, ok := logService.(*logs.AppLogService); ok {
			log.SetOutput(io.MultiWriter(os.Stderr, appLogService))
		}

		// Force colors even if output is redirected (e.g. to a pipe or MultiWriter)
		log.SetColorProfile(termenv.ANSI256)

		// Middleware
		router.Use(otelhttp.NewMiddleware(config.ServiceName))
		router.Use(sentryhttp.New(sentryhttp.Options{Repanic: true}).Handle)
		router.Use(appmiddleware.NewLoggingMiddleware())
		router.Use(middleware.Recoverer)
		router.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Access-Control-Allow-Origin", "*")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, sentry-trace, baggage, traceparent")
				if r.Method == "OPTIONS" {
					w.WriteHeader(http.StatusNoContent)
					return
				}
				next.ServeHTTP(w, r)
			})
		})

		// Initialize Database
		db, err := database.InitDB(options.DBPath)
		if err != nil {
			log.Fatal("failed to connect database", "err", err)
		}

		// Initialize OIDC Provider
		oidcProvider, err := auth.NewOIDCProvider(context.Background())
		if err != nil {
			log.Warn("failed to initialize OIDC provider", "err", err)
		}

		// Create Huma API Config
		apiConfig := huma.DefaultConfig(config.APITitle, "1.0.0")
		apiConfig.Components.SecuritySchemes = map[string]*huma.SecurityScheme{
			"bearerAuth": {
				Type:         "http",
				Scheme:       "bearer",
				BearerFormat: "JWT",
			},
			"apiKey": {
				Type: "apiKey",
				In:   "header",
				Name: "X-API-Key",
			},
		}

		// API Routes
		// Create a sub-router for /api so we can easily exclude it from the SPA catch-all
		apiRouter := chi.NewRouter()
		humaAPI = humachi.New(apiRouter, apiConfig)
		humaAPI.UseMiddleware(appmiddleware.NewAuthMiddleware(humaAPI, db))
		api.RegisterHandlers(humaAPI, router, db, oidcProvider, logService)

		router.Mount("/api", apiRouter)

		// Serve Frontend
		// Serve Frontend
		// Use embedded filesystem
		// The dist directory is embedded as "dist", so we likely need to subtree it if we want to serve directly.
		// However, http.FileServer + FS works well.
		// We need to strip "dist" if the root of FS is "dist".
		// Actually, fs.Sub can target "dist".

		frontendFS, err := fs.Sub(distFS, "dist")
		if err != nil {
			log.Fatal("Failed to load embedded frontend assets", "err", err)
		}

		fileServer := http.FileServer(http.FS(frontendFS))

		router.Handle("/*", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only handle GET requests for SPA routing
			if r.Method != http.MethodGet {
				http.NotFound(w, r)
				return
			}

			// Never serve index.html for API paths
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}

			// If the path doesn't have an extension, serve index.html (SPA)
			// But first check if the file actually exists in the FS
			path := strings.TrimPrefix(r.URL.Path, "/")
			if path == "" {
				path = "index.html"
			}

			f, err := frontendFS.Open(path)
			if err != nil {
				// File not found, serve index.html
				indexFile, err := frontendFS.Open("index.html")
				if err != nil {
					http.Error(w, "Frontend not found", http.StatusNotFound)
					return
				}
				defer indexFile.Close()
				io.Copy(w, indexFile)
				return
			}
			f.Close()

			fileServer.ServeHTTP(w, r)
		}))

		// Tell the CLI how to start your server.
		hooks.OnStart(func() {
			url := fmt.Sprintf("http://localhost:%d", options.Port)
			log.Info("Starting server", "url", url)
			// Use standard log adapter for the HTTP server if needed,
			// but here ListAndServe takes handler directly.
			if err := http.ListenAndServe(fmt.Sprintf(":%d", options.Port), router); err != nil {
				log.Fatal("Server failed", "err", err)
			}
		})
	})

	// Add a command to print the OpenAPI spec.
	cli.Root().AddCommand(&cobra.Command{
		Use:   "openapi",
		Short: "Print the OpenAPI spec",
		Run: func(cmd *cobra.Command, args []string) {
			b, _ := humaAPI.OpenAPI().MarshalJSON()
			fmt.Println(string(b))
		},
	})

	// Run the CLI. When passed no commands, it starts the server.
	cli.Run()
}

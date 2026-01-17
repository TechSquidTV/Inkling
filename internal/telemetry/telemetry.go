package telemetry

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/getsentry/sentry-go"
	sentryotel "github.com/getsentry/sentry-go/otel"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/prometheus"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

// Config holds telemetry configuration
type Config struct {
	SentryDSN   string
	ServiceName string
	Environment string
	MetricsPort string
	Spotlight   bool
}

// Init initializes the OpenTelemetry and Sentry SDKs
func Init(ctx context.Context, cfg Config) (func(), error) {
	if cfg.ServiceName == "" {
		cfg.ServiceName = "inkling-api"
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(cfg.ServiceName),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create resource: %w", err)
	}

	// 1. Initialize Sentry
	if cfg.SentryDSN != "" || cfg.Spotlight {
		dsn := cfg.SentryDSN
		if dsn == "" && cfg.Spotlight {
			dsn = "http://spotlight@localhost:8969/0"
		}

		err = sentry.Init(sentry.ClientOptions{
			Dsn:              dsn,
			Environment:      cfg.Environment,
			EnableTracing:    true,
			TracesSampleRate: 1.0,
		})
		if err != nil {
			return nil, fmt.Errorf("sentry.Init: %w", err)
		}
	}

	// 2. Initialize TracerProvider (with Sentry SpanProcessor)
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithResource(res),
		sdktrace.WithSpanProcessor(sentryotel.NewSentrySpanProcessor()),
	)
	otel.SetTracerProvider(tp)

	// Use Sentry's propagator to ensure we handle sentry-trace headers
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
		sentryotel.NewSentryPropagator(),
	))

	// 3. Initialize MeterProvider (with Prometheus Exporter)
	exporter, err := prometheus.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create prometheus exporter: %w", err)
	}
	mp := metric.NewMeterProvider(
		metric.WithResource(res),
		metric.WithReader(exporter),
	)
	otel.SetMeterProvider(mp)

	// 4. Start Metrics Server
	if cfg.MetricsPort != "" {
		go func() {
			mux := http.NewServeMux()
			mux.Handle("/metrics", promhttp.Handler())
			server := &http.Server{
				Addr:    ":" + cfg.MetricsPort,
				Handler: mux,
			}
			fmt.Fprintf(os.Stderr, "Starting metrics server on :%s/metrics\n", cfg.MetricsPort)
			if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				fmt.Fprintf(os.Stderr, "metrics server failed: %v\n", err)
			}
		}()
	}

	// Return shutdown function
	return func() {
		tp.Shutdown(context.Background())
		mp.Shutdown(context.Background())
		sentry.Flush(2 * time.Second)
	}, nil
}

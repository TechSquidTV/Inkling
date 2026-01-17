# Observability

This project uses a hybrid observability stack that combines **OpenTelemetry (OTEL)** for unified tracing and metrics with **Sentry** for deep error tracking and performance monitoring.

## Overview

The observability stack is designed to be "Open Source Friendly" while providing premium features for developers.

- **Tracing**: Powered by OpenTelemetry. Spans are automatically bridged to Sentry.
- **Metrics**: Powered by OpenTelemetry and exported in Prometheus format on an isolated port.
- **Errors**: Captured by Sentry with full stack traces and context.
- **Spotlight**: Supported for local development.

## Backend (Go)

The backend telemetry is centralized in `internal/telemetry`.

### Configuration
Telemetry is configured via environment variables or CLI flags:

| Variable | Flag | Default | Description |
|----------|------|---------|-------------|
| `SENTRY_DSN` | `--sentry-dsn` | | Your Sentry DSN for error and trace collection. |
| `METRICS_PORT` | `--metrics-port` | `9090` | The port used to serve Prometheus metrics. |
| `OTEL_SERVICE_NAME` | | `inkling-api` | The name of the service as it appears in traces. |

### Metrics
Prometheus metrics are served on a separate port to prevent accidental public exposure. By default, you can access them at:
`http://localhost:9090/metrics`

### Middleware
The server uses the following observability middleware:
1. `otelhttp`: Automatically creates spans for all incoming HTTP requests.
2. `sentryhttp`: Captures panics and reports them as Sentry errors with a `repanic` behavior to ensure the standard recoverer still works.

### Database Tracing
GORM is instrumented with the `gorm.io/plugin/opentelemetry` plugin, which adds SQL queries as child spans to the current request trace.

---

## Frontend (React)

The frontend uses the `@sentry/react` SDK with specific integrations for the project's stack.

### Logging & Error Tracking
The frontend uses the `@sentry/react` SDK along with the **LogTape Sentry Sink**.

- **TanStack Router**: Navigations are automatically tracked as transactions using the `tanstackRouterBrowserTracingIntegration`.
- **LogTape Integration**: Instead of capturing raw console logs, we use the `@logtape/sentry` sink. This provides:
    - **Trace Correlation**: Logs and breadcrumbs are automatically linked to active Sentry spans.
    - **Structured Logging**: Rich metadata is sent to Sentry's modern Logs API.
    - **Breadcrumbs**: All log messages become navigation/debug trail breadcrumbs in Sentry issues.

### Distributed Tracing
The frontend is configured to propagate trace context to the backend using W3C standard headers (`traceparent` and `baggage`). This links a browser action (like a button click) directly to the resulting backend API calls and database queries.

## Local Development
## Local Development with Spotlight

[Spotlight](https://spotlightjs.com/) brings the power of Sentry into your local development environment. It allows you to see errors, traces, and logs in real-time without needing a Sentry account or an internet connection.

### 1. Start the Spotlight Sidecar
Choose one of the following methods:

- **npx (Fastest)**:
  ```bash
  npx @spotlightjs/spotlight
  ```
- **Docker**:
  ```bash
  docker run --rm -p 8969:8969 ghcr.io/getsentry/spotlight:latest
  ```
- **Desktop App**: Download from [spotlightjs.com](https://spotlightjs.com/).

Once running, you can access the UI at `http://localhost:8969`.

### 2. Configure the Application
Set the following environment variable in your `.env` file:

```bash
SENTRY_SPOTLIGHT=1
```

#### Backend (Go)
The Go service is configured to use Spotlight when `SENTRY_SPOTLIGHT=1` is set. It uses a placeholder DSN (`http://spotlight@localhost:8969/0`) to route telemetry to your local instance.

#### Frontend (React)
The React app uses the `Sentry.spotlightBrowserIntegration()` to stream data. It also includes `Sentry.captureConsoleIntegration()` for real-time console log monitoring in the Spotlight UI.

### 3. Verify Your Setup
1. Ensure Spotlight is running.
2. Start the application (`make dev`).
3. Check the Spotlight UI—you should see:
   - **Errors**: Full stack traces for any exceptions.
   - **Traces**: Distributed transactions linking frontend clicks to backend processing.
   - **Logs**: Real-time console and server logs.

### Why Spotlight?
- **No Sentry Account Needed**: Works entirely locally for development.
- **Real-time visibility**: See exactly what's happening as you code.
- **Distributed Tracing**: Visualizes the flow of requests across the entire stack.
- **AI-Powered Debugging**: Supports the **Model Context Protocol (MCP)**, allowing AI assistants like Cursor or Claude to analyze your runtime data and help you debug faster.

---

### Prometheus & Grafana
To visualize metrics locally, point a Prometheus instance to `localhost:9090/metrics`.
